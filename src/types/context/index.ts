import { prismaClient } from '@utils'

import { Request, Response } from 'express'

export interface MyContext {
  prisma: typeof prismaClient
  req: Request
  res: Response
}
