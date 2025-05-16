const { withChakraTheme } = require('@chakra-ui/next-js')

module.exports = withChakraTheme({
  chakra: {
    theme: './theme/index.js', // Correct path to theme
  },
})