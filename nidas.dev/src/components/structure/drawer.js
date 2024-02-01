import React, { useState, useRef } from 'react';
import {
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  IconButton,
  Text,
  Spacer,
  Box,
  VStack
} from '@chakra-ui/react';

import { AddIcon } from '@chakra-ui/icons';

function NavDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef();

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      <IconButton ref={btnRef} icon={<AddIcon />} size='sm' onClick={onOpen}>
        Nav
      </IconButton>

      <Drawer
        isOpen={isOpen}
        placement='right'
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader fontFamily='heading' >UNDER CONSTRUCTION</DrawerHeader>

          <DrawerBody>
          <VStack>
            <Box>
            <Text fontFamily='body'>
            You are absolutely right. It is all meaningless. 
            No matter how many dreams and hopes you have, 
            no matter how happy your life may be, 
            if you are crushed by a rock, it's all the same. 
            We will all die.
            </Text>
            </Box>

            <Spacer />

            <Box>
            <Text fontFamily='body'>
            Then, is life meaningless? Is it meaningless to be born and hope for the best?
            </Text>
            </Box>

            <Spacer />
            
            <Box>
            <Text fontFamily='body'>
            Is it the same for our dead comrades? Were those soldiers meaningless?
            </Text>
            </Box>

            <Spacer />

            <Box>
            <Text fontFamily='body'>
            No, they were not. It is we who give meaning to those soldiers! Those brave dead! The poor dead!
            </Text>
            </Box>

            <Spacer />

            <Box>
            <Text fontFamily='body'>
            It is we, the living, who can remember. We die here and entrust the meaning to the next living. That is the only way to resist this cruel world.
            </Text>
            </Box>

            <Spacer />
            
            <Box>
            <Text fontFamily='heading'>
            Soldiers, rage! Soldiers, scream! Soldier, fight!
            </Text>
            </Box>
          </VStack>
          </DrawerBody>

          <DrawerFooter>
            <IconButton /> {/* Add your IconButton here */}
            <Button variant='outline' mr={3} onClick={onClose}>
              Close
            </Button>
            {/* Add your additional buttons or actions here */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default NavDrawer;
