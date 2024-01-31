import React from 'react';
import {ChakraProvider, Box} from '@chakra-ui/react';
import Layout from '../components/layout/layout';
import Theme from '../themes/theme';
import Header from '../components/structure/header';
import Footer from '../components/structure/footer';
import Construction from './construction';
import Fonts from '../themes/fonts';

function App() {
  return (
    <ChakraProvider theme={Theme}>
      <Box textAlign="center" fontSize="xl">
      <Layout header={Header} footer={Footer} children={Construction}>
        <Fonts />
        <Construction />
      </Layout>
      </Box>
    </ChakraProvider>
  );
}

export default App;
