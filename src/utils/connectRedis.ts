import RedisStore from 'connect-redis'

import { createClient } from 'redis'

// Initialize client.
const redisClient = createClient()

redisClient.connect().catch(console.error)

// Initialize store.
export const redisStore = new RedisStore({
  client: redisClient,
  disableTouch: true,
  prefix: 'myapp:'
})
