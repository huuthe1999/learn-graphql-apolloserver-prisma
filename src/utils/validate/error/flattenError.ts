import { FieldError } from '@types'

import { ValidationError } from 'class-validator'

export function flattenErrors(errors: ValidationError[]): FieldError[] {
  const result: FieldError[] = []

  function traverse(error: ValidationError) {
    if (error.constraints) {
      for (const constraint of Object.values(error.constraints)) {
        result.push({ field: error.property, message: constraint })
      }
    }

    if (error.children) {
      for (const child of error.children) {
        traverse(child)
      }
    }
  }

  for (const error of errors) {
    traverse(error)
  }

  return result
}
