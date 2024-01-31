import React from 'react';
import {Box, Text, Code, Grid, VStack} from '@chakra-ui/react';
import config from '../data/text/config';
import { Logo } from '../themes/Logo';

const Construction = (props) => {
    props = config.construction
    return (

    <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
            <VStack spacing={8}>
                <Logo h="40vmin" pointerEvents="none" />
                <Text>
                    <Code colorScheme='red' fontSize="xl">{props}</Code>
                </Text>
            </VStack>
        </Grid>
    </Box>

    );
};

export default Construction;
