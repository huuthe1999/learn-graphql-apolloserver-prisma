import type { GraphQLFormattedError } from 'graphql'

import { GraphQLError } from 'graphql'

import { ArgumentValidationError } from 'type-graphql'

import { ApolloServerErrorCode, unwrapResolverError } from '@apollo/server/errors'

import { flattenErrors, splitLastErrorLine } from '@utils'

import type { ValidationError as ClassValidatorValidationError } from 'class-validator'

import { Prisma } from '@prisma/client'

import { FieldError } from '@types'

export class ValidationError extends GraphQLError {
  public constructor(validationErrors: ClassValidatorValidationError[]) {
    super('Validation Error', {
      extensions: {
        code: ApolloServerErrorCode.BAD_USER_INPUT,
        validationErrors: flattenErrors(validationErrors)
      }
    })

    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export function classValidatorError(
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  const originalError = unwrapResolverError(error)

  // Validation
  if (originalError instanceof ArgumentValidationError) {
    return new ValidationError(originalError.validationErrors)
  }

  if (originalError instanceof Prisma.PrismaClientKnownRequestError) {
    // The .code property can be accessed in a type-safe manner
    if (originalError.code === 'P2002') {
      return new GraphQLError('Invalid argument value', {
        extensions: {
          code: ApolloServerErrorCode.BAD_USER_INPUT,
          validationErrors: [
            {
              field: (originalError.meta?.target as any[])[0],
              message: splitLastErrorLine(originalError.message)
            }
          ] as FieldError[]
        }
      })
    }
  }

  // Generic
  return formattedError
}
