import { BaseContext } from '@apollo/server'

import { prismaClient } from '@utils'

export interface MyContext extends BaseContext {
  token: string
  prisma: typeof prismaClient
}
