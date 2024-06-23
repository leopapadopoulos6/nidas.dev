import { Box, Flex, Spacer, Text } from '@chakra-ui/react';
import config from '../../data/text/config';
import NavDrawer from './drawer';


const Header = ({name}) => {
    name = config.name
    return (
        <Flex
            mt='4'
            borderBottom='1px solid'
            borderBottomColor='blue'
        >
            <Box p='4'>
                <Text color='yellow' fontFamily='heading'>{name}</Text>
            </Box>
            <Spacer />
            <Box p='4'>
                <NavDrawer/>
            </Box >
        </Flex>
    );
};

export default Header;