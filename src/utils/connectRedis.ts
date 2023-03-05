import RedisStore from 'connect-redis'

import { createClient } from 'redis'

// Initialize client.
const redisClient = createClient()

redisClient.connect().catch(console.error)

// Initialize store.
export const redisStore = new RedisStore({
  client: redisClient,
  disableTouch: false,
  prefix: 'myapp:'
})

export const getSessions = async () => {
  try {
    const keys = await redisClient.keys(`${redisStore.prefix}*`)

    if (keys.length) {
      const sessions = await redisClient.mGet(keys)

      console.log(sessions)
    } else {
      console.log('No sessions found')
    }
  } catch (err) {
    throw err
  }
}
