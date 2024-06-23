import React from 'react';
import {Box, Text, Code, Grid, VStack, Spacer} from '@chakra-ui/react';
import config from '../data/text/config';
import { Logo } from '../themes/Logo';

const Construction = (props) => {
    props = config.construction
    return (

    <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
            <VStack spacing={8}>
                <Spacer />
                <Logo h="40vmin" pointerEvents="none" />
                <Spacer />
                <Text>
                    <Code fontFamily="heading" bgColor='red' fontSize="lg">{props}</Code>
                </Text>
                <Spacer />
            </VStack>
        </Grid>
    </Box>

    );
};

export default Construction;
