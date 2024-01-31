import React from 'react';
import {ChakraProvider, Box, theme,} from '@chakra-ui/react';
import Layout from '../components/layout/layout';
import Header from '../components/structure/header';
import Construction from './construction';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box textAlign="center" fontSize="xl">
      <Layout header={Header} children={Construction}>
        <Construction />
      </Layout>
      </Box>
    </ChakraProvider>
  );
}

export default App;
