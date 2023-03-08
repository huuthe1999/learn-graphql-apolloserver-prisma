import { Arg, Authorized, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql'

import { MyContext, UserLoginInput } from '@types'

import argon2 from 'argon2'

import { IsEmail, MinLength, ValidateNested } from 'class-validator'

import { customClassValidatorError, ValidationError } from '@utils'

import { COOKIE_NAME, INTERNAL_SERVER_ERROR, USER_EXISTED, USER_NOT_FOUND } from '@constants'

import {
  applyArgsTypesEnhanceMap,
  applyInputTypesEnhanceMap,
  applyModelsEnhanceMap,
  applyResolversEnhanceMap,
  User,
  UserCreateInput
} from '@generated'

import { ApolloServerErrorCode } from '@apollo/server/errors'

import { GraphQLFormattedError } from 'graphql'

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
  @Query(_return => User)
  async me(@Ctx() { prisma, req }: MyContext): Promise<User | ValidationError> {
    try {
      return await prisma.user.findUniqueOrThrow({
        where: {
          id: req.session.userId
        },
        include: {
          _count: true
        }
      })
    } catch (error) {
      return new ValidationError('No user found', 'USER_NOT_FOUND')
    }
  }

  @Mutation(_return => User, {
    nullable: true
  })
  async createNewUser(
    @Arg('data')
    newUserData: UserCreateInput,
    @Ctx() { prisma }: MyContext
  ): Promise<User | ValidationError | null> {
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
        return new ValidationError('User existed', USER_EXISTED, undefined, [
          {
            field: existingUser.username === newUserData.username ? 'username' : 'email',
            message: `${
              existingUser.username === newUserData.username ? 'Username' : 'Email'
            } already taken`
          }
        ])

      const hashedPassword = await argon2.hash(newUserData.password)

      return await prisma.user.create({
        data: {
          ...newUserData,
          password: hashedPassword
        }
      })
    } catch (e) {
      return new ValidationError('Internal server error', INTERNAL_SERVER_ERROR)
    }
  }

  @Mutation(_return => User, { nullable: true })
  async loginUser(
    @Arg('data')
    { username, password }: UserLoginInput,
    @Ctx() { prisma, req }: MyContext
  ): Promise<User | GraphQLFormattedError> {
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
        return new ValidationError(
          'Authenticated failed',
          ApolloServerErrorCode.BAD_USER_INPUT,
          undefined,
          [
            {
              field: 'username',
              message: 'Username or password invalid'
            },
            {
              field: 'password',
              message: 'Username or password invalid'
            }
          ]
        )
      }

      req.session.userId = existingUser.id

      return existingUser
    } catch (e) {
      const error = customClassValidatorError(e)

      return error ? error : new ValidationError('User not found', USER_NOT_FOUND)
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
