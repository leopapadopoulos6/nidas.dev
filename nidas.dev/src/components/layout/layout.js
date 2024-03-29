import React from 'react';
import { Container, Flex, Box } from '@chakra-ui/react';


const Layout = ({ children, header, footer, ...props }) => (
  React.createElement(Container, { maxW: 'container.xl' },
    React.createElement(Flex, {
      minH: '100vh',
      direction: 'column',
      borderColor: 'black',
      borderTop: { base: '1px solid', sm: 'none' },
      borderBottom: { base: '1px solid', sm: 'none' },
      borderLeft: '1px solid',
      borderRight: '1px solid',
      

    },
      header && React.createElement(header, null),
      React.createElement(Box, { as: 'main', flex: 1, ...props },
        children
      ),
      footer && React.createElement(footer, null)
    )
  )
);

export default Layout;
