import { Flex, Link, Text, IconButton, Stack } from '@chakra-ui/react';
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
      pb='12'
      px={{ base: '4', md: '8' }}
      borderTop='1px solid'
      borderTopColor='aqua'
      color='aqua'
    >
      <Stack
        direction={{ base: 'column', lg: 'row' }}
        spacing={{ base: '6px', lg: '16px', md: '16px', sm: '24px'}}
        mb={{ base: '16px'}}
      >
        <Text casing='uppercase'>{config.copyright}</Text>
        <Text fontFamily='body' casing='uppercase'>
          2024 LEONIDAS PAPADOPOULOS
        </Text>
        <Text fontFamily='body' casing='uppercase' cursor='url(/img/nyc.png), text'>
          LONG ISLAND, NY
        </Text>
      </Stack>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={{ base: '6px', lg: '16px', md: '16px', sm: '24px'}}
        mb={{ base: '16px' }}
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
