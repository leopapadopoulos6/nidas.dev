import { Box } from '@chakra-ui/react';
import { ColorModeSwitcher } from '../../themes/ColorModeSwitcher';

const Header = () => (
  <Box p={4} color="black">
    Leonidas Papadopoulos
    <ColorModeSwitcher/>
  </Box>
);

export default Header;