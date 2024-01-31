import { Flex, Link, Text, HStack, IconButton, Stack } from '@chakra-ui/react';
import { VscArrowUp } from 'react-icons/vsc';
import config from '../../data/text/config';

const links = [
  { name: 'EMAIL', href: config.email_link },
  { name: 'GITHUB', href: config.github },
  { name: 'LINKEDIN', href: config.linkedin },
];

const Footer = () => {


  return (
    <Flex
      as='footer'
      align={{ base: 'stretch', md: 'center' }}
      justify='space-between'
      direction={{ base: 'column', md: 'row' }}
      mt='4'
      pt='12'
      pb='24'
      px={{ base: '4', md: '8' }}
      borderColor='black'
      borderTop='1px solid'
    >
      <Stack
        direction={{ base: 'column', lg: 'row' }}
        spacing={{ base: '6', lg: '16' }}
        mb={{ base: '16', md: 0 }}
      >
        <Text casing='uppercase'>{config.copyright}</Text>
        <Text fontFamily='body' casing='uppercase' cursor='url(/img/maple-leaf.png), text'>
          2024 LEONIDAS PAPADOPOULOS
        </Text>
      </Stack>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        spacing='16'
      >
        <HStack
          w='full'
          spacing={{ base: '6', md: '8' }}
          justify={{ base: 'space-between', sm: 'flex-start' }}
        >
          {links.map(({ name, href }) => (
            <Link
              key={name}
              title={name}
              href={href}
              variant='social'
              isExternal
              fontFamily='body'
            >
              {name}
            </Link>
          ))}
        </HStack>
        <IconButton
          aria-label='go-to-top'
          title='go-to-top'
          icon={<VscArrowUp />}
          variant='icon'
          size='icon'
          onClick={() => window.scrollTo(0, 0)}
        />
      </Stack>
    </Flex>
  );
};

export default Footer;
