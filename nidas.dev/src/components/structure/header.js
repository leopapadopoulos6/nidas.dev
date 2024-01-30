import { Box, Flex, Spacer, Text, IconButton } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { ColorModeSwitcher } from '../../themes/ColorModeSwitcher';
import config from '../../data/text/config';



const Header = ({name}) => {
    name = config.name
    return (
        <Flex>
            <Box p='4'>
                <Text>{name}</Text>
            </Box>
            <Spacer />
            <Box p='4'> 
                <ColorModeSwitcher />
            </Box>
            <Box p='4'>
                <IconButton size='sm' icon={<AddIcon />} />
            </Box >
        </Flex>
    );
};

export default Header;