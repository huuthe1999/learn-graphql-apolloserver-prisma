// eslint-disable-next-line prettier/prettier

import 'reflect-metadata'

import { ApolloServer } from '@apollo/server'

import { UserResolver } from '@resolvers'

import dotenv from 'dotenv-safe'

import express, { Express } from 'express'

import http from 'http'

import cors from 'cors'

import bodyParser from 'body-parser'

import { buildSchema } from 'type-graphql'

import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'

import { MyContext } from '@types'

import { expressMiddleware } from '@apollo/server/express4'

dotenv.config({ allowEmptyValues: true })

const main = async () => {
  const app: Express = express()

  const httpServer = http.createServer(app)

  const apolloServer = new ApolloServer<MyContext>({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await apolloServer.start()

  app.use(
    '/',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  )

  // Modified server startup
  await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve))

  console.log(`🚀 Server ready at http://localhost:4000/`)
}

main().catch((error) => console.log(error))
