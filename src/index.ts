// eslint-disable-next-line prettier/prettier

import 'reflect-metadata'

import { ApolloServer } from '@apollo/server'

import dotenv from 'dotenv-safe'

import express, { Express } from 'express'

import http from 'http'

import cors from 'cors'

import bodyParser from 'body-parser'

import { buildSchema } from 'type-graphql'

import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'

import { expressMiddleware } from '@apollo/server/express4'

import { classValidatorError, prismaClient, redisStore } from '@utils'

import { resolvers } from '@generated'

import { PostResolver, UserResolver } from '@resolvers'

import session from 'express-session'

import { COOKIE_NAME, COOKIE_SECRET, PORT, __prod__ } from '@constants'

import { authChecker } from '@middlewares'

dotenv.config({ allowEmptyValues: true })

const main = async () => {
  const app: Express = express()

  const httpServer = http.createServer(app)

  __prod__ && app.set('trust proxy', 1)

  // Initialize sesssion storage.
  app.use(
    session({
      name: COOKIE_NAME,
      store: redisStore,
      cookie: {
        maxAge: 1000 * 60 * 60, //1 hour
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__
      },
      rolling: true,
      resave: true, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: COOKIE_SECRET
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [...resolvers, PostResolver, UserResolver],
      emitSchemaFile: true,
      authChecker,
      validate: { forbidUnknownValues: false }
    }),
    formatError: classValidatorError,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: !__prod__,
    includeStacktraceInErrorResponses: !__prod__
  })

  await apolloServer.start()

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: ['http://localhost:3000'],
      credentials: true
    }),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({
        prisma: prismaClient,
        req,
        res
      })
    })
  )

  await new Promise<void>(resolve => httpServer.listen({ port: PORT }, resolve))

  console.log(`???? Server ready at http://localhost:${PORT}/graphql`)
}

main().catch(async error => {
  console.log(error)
})
