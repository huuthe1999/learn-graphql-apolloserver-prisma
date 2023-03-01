import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

import { User } from '@generated'

import { CustomUserCreateInput, MyContext } from '@types'

import argon2 from 'argon2'

import { GraphQLError } from 'graphql'

// import { validate } from 'class-validator'

// import { ApolloServerErrorCode } from '@apollo/server/errors'

// Generate resolver type-graphql with prisma
@Resolver()
export class UserResolver {
  @Mutation(_returns => User, {
    nullable: true
  })
  async createNewUser(
    @Arg('data', { validate: true })
    newUserData: CustomUserCreateInput,
    @Ctx() { prisma }: MyContext
  ): Promise<User | null> {
    // Validate input data
    // const errors = await validate(newUserData, {
    //   validationError: {
    //     target: false
    //   }
    // })

    // if (errors.length > 0) {
    //   throw new GraphQLError('Validation failed!', {
    //     extensions: {
    //       code: ApolloServerErrorCode.BAD_USER_INPUT,
    //       validationErrors: errors,
    //       http: {
    //         status: 400
    //         // headers: new Map([
    //         //   ['some-header', 'it was bad'],
    //         //   ['another-header', 'seriously']
    //         // ])
    //       }
    //     }
    //   })
    // }

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

      if (existingUser !== null) throw new GraphQLError('User existed')

      const hashedPassword = await argon2.hash(newUserData.password)

      return await prisma.user.create({
        data: {
          ...newUserData,
          password: hashedPassword
        }
      })
    } catch (error) {
      console.log(error)

      throw error
    }
  }
}
