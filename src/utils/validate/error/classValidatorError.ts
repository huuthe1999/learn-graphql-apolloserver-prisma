import type { GraphQLFormattedError, SourceLocation } from 'graphql'

import { GraphQLError } from 'graphql'

import { ArgumentValidationError } from 'type-graphql'

import { ApolloServerErrorCode, unwrapResolverError } from '@apollo/server/errors'

import { flattenErrors, splitLastErrorLine } from '@utils'

import type { ValidationError as ClassValidatorValidationError } from 'class-validator'

import { Prisma } from '@prisma/client'

import { FieldError } from '@types'

import { RECORD_NOT_FOUND } from '@constants'

export class ValidationError extends GraphQLError {
  public constructor(
    message: string,
    code: ApolloServerErrorCode | string,
    validationErrors?: ClassValidatorValidationError[],
    error?: FieldError[],
    path?: ReadonlyArray<string | number>,
    positions?: ReadonlyArray<SourceLocation>
  ) {
    super(message, {
      extensions: {
        code,
        validationErrors: error
          ? error
          : validationErrors
          ? flattenErrors(validationErrors)
          : undefined,
        path,
        positions
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
    return new ValidationError(
      'Validation Error',
      ApolloServerErrorCode.BAD_USER_INPUT,
      originalError.validationErrors,
      undefined
    )
  }

  if (originalError instanceof Prisma.PrismaClientKnownRequestError) {
    // The .code property can be accessed in a type-safe manner
    if (originalError.code === 'P2002') {
      return new ValidationError(
        'Invalid argument value',
        ApolloServerErrorCode.BAD_USER_INPUT,
        undefined,
        [
          {
            field: (originalError.meta?.target as any[])[0],
            message: splitLastErrorLine(originalError.message) as string
          }
        ]
      )
    }

    // Error not found record
    if (originalError.code === 'P2025') {
      return new ValidationError(originalError.name, RECORD_NOT_FOUND, undefined, [
        {
          field: originalError.meta?.cause as string,
          message: splitLastErrorLine(originalError.message) as string
        }
      ])
    }
  }

  // Generic
  return formattedError
}

export function customClassValidatorError(error: unknown): GraphQLFormattedError | null {
  const originalError = unwrapResolverError(error)

  if (originalError instanceof Prisma.PrismaClientKnownRequestError) {
    // The .code property can be accessed in a type-safe manner
    if (originalError.code === 'P2002') {
      return new ValidationError(
        'Invalid argument value',
        ApolloServerErrorCode.BAD_USER_INPUT,
        undefined,
        [
          {
            field: (originalError.meta?.target as any[])[0],
            message: splitLastErrorLine(originalError.message) as string
          }
        ]
      )
    }

    // // Error not found record
    // if (originalError.code === 'P2025') {
    //   return new ValidationError(originalError.name, RECORD_NOT_FOUND, undefined, [
    //     {
    //       field: originalError.meta?.cause as string,
    //       message: splitLastErrorLine(originalError.message) as string
    //     }
    //   ])
    // }
  }

  return null
}
