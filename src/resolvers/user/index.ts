import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

import { CustomUserCreateInput, MyContext, UserLoginInput, UserMutationResponse } from '@types'

import argon2 from 'argon2'

import { validate } from 'class-validator'

import { Prisma } from '@prisma/client'

import { flattenErrors } from '@utils'

// import { validate } from 'class-validator'

// import { ApolloServerErrorCode } from '@apollo/server/errors'

// Generate resolver type-graphql with prisma
@Resolver()
export class UserResolver {
  @Mutation(_returns => UserMutationResponse, {
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
    @Ctx() { prisma }: MyContext
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

      if (isPasswordValid)
        return {
          isSuccess: true,
          status: 200,
          user: existingUser,
          message: 'Successful'
        }

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
}
