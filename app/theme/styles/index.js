import { extendTheme } from '@chakra-ui/react'
import colors from './foundations/colors'
import typography from './foundations/typography'
import Button from './components/button'

export default extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors,
  ...typography,
  components: { Button }
})