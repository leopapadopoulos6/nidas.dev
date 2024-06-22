import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark'
}

const Theme = extendTheme({
  config,
  colors: {
    black: '#16161D',
    bg: '#282828',
    fg: '#ebdbb2',
    red: '#cc241d',
    yellow: '#98971a',
    green: '#98971a',
    blue: '#458588',
    purple: '#b16286',
    aqua: '#689d6a',
    gray: '#a89984'
  },
  styles: {
    global: {
      html: {
        // scrollBehavior: 'smooth',
      },
      '::selection': {
        background: 'red.400',
      },
    },
  },
  fonts: {
    heading: 'Hanson, sans-serif',
    body: 'Manrope, sans-serif',
  },
  shadows: {
    gray: '0 0 1px 2px rgba(75, 85, 99, .75)',
  },
  sizes: {
    header: {
      height: '6.5625rem',
    },
  }
});

export default Theme;