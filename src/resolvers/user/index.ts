import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

import { CustomUserCreateInput, MyContext, TypeError, UserMutationResponse } from '@types'

import argon2 from 'argon2'

import { validate } from 'class-validator'

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
        typeError: TypeError.INPUT,
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
          status: 400,
          message: 'User existed!',
          typeError: TypeError.SERVER,
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
}
