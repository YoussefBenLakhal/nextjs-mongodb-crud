'use client' // MUST be first line

import { CacheProvider } from '@emotion/react'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import theme from './theme/styles' // Path to your theme
import createEmotionCache from './lib/emotion-cache' // Cache setup

const cache = createEmotionCache()

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Required for color mode to work */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      </head>
      <body>
        {/* Emotion cache provider */}
        <CacheProvider value={cache}>
          {/* Chakra UI theme provider */}
          <ChakraProvider theme={theme}>
            {children}
          </ChakraProvider>
        </CacheProvider>
      </body>
    </html>
  )
}