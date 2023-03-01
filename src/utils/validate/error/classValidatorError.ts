import type { GraphQLFormattedError } from 'graphql'

import { GraphQLError } from 'graphql'

import { ArgumentValidationError } from 'type-graphql'

import { ApolloServerErrorCode, unwrapResolverError } from '@apollo/server/errors'

import type { ValidationError as ClassValidatorValidationError } from 'class-validator'

type IValidationError = Pick<
  ClassValidatorValidationError,
  'property' | 'value' | 'constraints' | 'children'
>

function formatValidationErrors(validationError: IValidationError): IValidationError {
  return {
    property: validationError.property,
    ...(validationError.value && { value: validationError.value }),
    ...(validationError.constraints && {
      constraints: validationError.constraints
    }),
    ...(validationError.children &&
      validationError.children.length !== 0 && {
        children: validationError.children.map(child => formatValidationErrors(child))
      })
  }
}

class ValidationError extends GraphQLError {
  public constructor(validationErrors: ClassValidatorValidationError[]) {
    super('Validation Error', {
      extensions: {
        code: ApolloServerErrorCode.BAD_USER_INPUT,
        validationErrors: validationErrors.map(validationError =>
          formatValidationErrors(validationError)
        )
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

  // Generic
  return formattedError
}
