import { Arg, Authorized, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql'

import { CustomUserCreateInput, MyContext, UserLoginInput, UserMutationResponse } from '@types'

import argon2 from 'argon2'

import { IsEmail, MinLength, ValidateNested, validate } from 'class-validator'

import { Prisma } from '@prisma/client'

import { flattenErrors } from '@utils'

import { COOKIE_NAME } from '@constants'

import {
  applyArgsTypesEnhanceMap,
  applyInputTypesEnhanceMap,
  applyModelsEnhanceMap,
  applyResolversEnhanceMap
} from '@generated'

// import { validate } from 'class-validator'

// import { ApolloServerErrorCode } from '@apollo/server/errors'

applyResolversEnhanceMap({
  User: {
    _all: [
      UseMiddleware(({ info }, next) => {
        console.log(`Query "${info.fieldName}" accessed`)

        return next()
      })
    ],
    createOneUser: [
      Authorized(),
      UseMiddleware(async ({ info }, next) => {
        try {
          return await next()
        } catch (error) {
          throw error
        }
      })
    ]
  }
})

applyModelsEnhanceMap({
  User: {
    fields: {
      email: [IsEmail()]
    }
  }
})

applyArgsTypesEnhanceMap({
  CreateOneUserArgs: {
    fields: {
      data: [ValidateNested()]
    }
  }
})

applyInputTypesEnhanceMap({
  UserCreateInput: {
    fields: {
      email: [IsEmail()],
      password: [MinLength(8)]
    }
  }
})

@Resolver()
export class UserResolver {
  @Authorized()
  @Query(_return => UserMutationResponse)
  async me(@Ctx() { prisma, req }: MyContext): Promise<UserMutationResponse> {
    try {
      const existingUser = await prisma.user.findUniqueOrThrow({
        where: {
          id: req.session.userId
        },
        include: {
          _count: true,
          Post: {
            where: {
              id: {
                equals: 1
              }
            }
          }
        }
      })

      return {
        isSuccess: true,
        status: 200,
        user: existingUser,
        message: 'Found user successful'
      }
    } catch (error) {
      return {
        isSuccess: false,
        status: 500,
        message: 'User not found'
      }
    }
  }

  @Mutation(_return => UserMutationResponse, {
    nullable: true
  })
  async createNewUser(
    // @Arg('data', { validate: true })
    @Arg('data')
    newUserData: CustomUserCreateInput,
    @Ctx() { prisma }: MyContext
  ): Promise<UserMutationResponse> {
    // Validate input data
    const errors = await validate(newUserData, {
      validationError: {
        target: false
      }
    })

    if (errors.length > 0) {
      return {
        isSuccess: false,
        status: 400,
        message: 'Validation failed!',
        errors: flattenErrors(errors)
      }
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            {
              email: {
                equals: newUserData.email
              }
            },
            {
              username: {
                equals: newUserData.username
              }
            }
          ]
        }
      })

      if (existingUser !== null)
        return {
          isSuccess: false,
          status: 409,
          message: 'User existed!',
          errors: [
            {
              field: existingUser.username === newUserData.username ? 'username' : 'email',
              message: `${
                existingUser.username === newUserData.username ? 'Username' : 'Email'
              } already taken`
            }
          ]
        }

      const hashedPassword = await argon2.hash(newUserData.password)

      return {
        isSuccess: true,
        status: 200,
        message: 'Create User Successful',
        user: await prisma.user.create({
          data: {
            ...newUserData,
            password: hashedPassword
          }
        })
      }
    } catch (error) {
      throw error
    }
  }

  @Mutation(_return => UserMutationResponse)
  async loginUser(
    @Arg('data')
    { username, password }: UserLoginInput,
    @Ctx() { prisma, req }: MyContext
  ): Promise<UserMutationResponse> {
    const usernameIsEmail = username.includes('@')

    try {
      const existingUser = await prisma.user.findFirstOrThrow({
        where: usernameIsEmail
          ? {
              email: username
            }
          : {
              username
            }
      })

      const isPasswordValid = await argon2.verify(existingUser.password, password)

      if (!isPasswordValid) {
        return {
          isSuccess: false,
          status: 404,
          message: 'Authenticated failed',
          errors: [
            {
              field: 'username',
              message: 'Username or password invalid'
            },
            {
              field: 'password',
              message: 'Username or password invalid'
            }
          ]
        }
      }

      req.session.userId = existingUser.id

      return {
        isSuccess: true,
        status: 200,
        user: existingUser,
        message: 'Logging successful'
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return {
          isSuccess: false,
          status: 500,
          message: e.message
        }
      }

      return {
        isSuccess: false,
        status: 500,
        message: 'Something went wrong'
      }
    }
  }

  @Mutation(_return => Boolean)
  logoutUser(@Ctx() { req, res }: MyContext): Promise<boolean> {
    return new Promise(resolve => {
      req.session.destroy(err => {
        res.clearCookie(COOKIE_NAME)

        if (err) {
          resolve(false)

          return
        }

        resolve(true)
      })
    })
  }
}
