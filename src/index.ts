// eslint-disable-next-line prettier/prettier

import 'reflect-metadata'

import { ApolloServer } from '@apollo/server'

import dotenv from 'dotenv-safe'

import express, { Express, Request } from 'express'

import http from 'http'

import cors from 'cors'

import bodyParser from 'body-parser'

import { buildSchema } from 'type-graphql'

import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'

import { expressMiddleware } from '@apollo/server/express4'

import { myFormatError, prismaClient } from '@utils'

import { resolvers } from '@generated'

import { UserResolver } from '@resolvers'

dotenv.config({ allowEmptyValues: true })

const setHttpPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors({ response, errors }: { response: any; errors: any }) {
        console.log(response, errors)
      }
    }
  }
}

const main = async () => {
  const app: Express = express()

  const httpServer = http.createServer(app)

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [...resolvers, UserResolver],
      validate: false
      // orphanedTypes:[]
      // validate: argValue => {
      //   validateOrReject(argValue!).catch(errors => {
      //     console.log('Promise rejected (validation failed). Errors: ', errors)
      //   })
      // }
    }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: myFormatError,
    includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development'
  })

  await apolloServer.start()

  app.use(
    '/',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }: { req: Request }) => ({
        token: req.headers.token,
        prisma: prismaClient
      })
    })
  )

  const PORT = process.env.PORT || 4000

  await new Promise<void>(resolve => httpServer.listen({ port: PORT }, resolve))

  console.log(`🚀 Server ready at http://localhost:${PORT}`)
}

main().catch(async error => {
  console.log(error)
})
