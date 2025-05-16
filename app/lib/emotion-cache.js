import createCache from '@emotion/cache'

export default function createEmotionCache() {
  return createCache({
    key: 'css',
    prepend: true,
    speedy: process.env.NODE_ENV === 'production'
  })
}