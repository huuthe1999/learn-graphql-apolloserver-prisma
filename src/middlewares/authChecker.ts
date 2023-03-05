import { AuthChecker } from 'type-graphql'

import { MyContext } from '@types'

import { GraphQLError } from 'graphql'

export const authChecker: AuthChecker<MyContext> = ({ context: { req } }) => {
  if (!req.session.userId) {
    throw new GraphQLError('You need to be authenticated to perform this action!', {
      extensions: {
        code: 'UNAUTHENTICATED'
      }
    })
  }

  return true
}
