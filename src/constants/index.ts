export const __prod__ = process.env.NODE_ENV === 'production'
export const COOKIE_NAME = 'qid'
export const COOKIE_SECRET = process.env.REDIS_SECRET as string
export const PORT = process.env.PORT || 4000
// export const FORGET_PASSWORD_PREFIX = 'forget-password:'
