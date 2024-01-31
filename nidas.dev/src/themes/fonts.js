import { Global } from '@emotion/react';

const Fonts = () => (
  <Global
    styles={`
      @font-face {
        font-family: 'Hanson';
        font-style: normal;
        font-weight: 700;
        font-display: swap;
        src: url('/fonts/hanson-bold.ttf') format('truetype');
      }

      @font-face {
        font-family: 'Manrope';
        font-style: thin;
        font-weight: 100;  // Adjust the weight as needed
        font-display: swap;
        src: url('/fonts/thin.otf') format('opentype');
      }
    `}
  />
);
export default Fonts;