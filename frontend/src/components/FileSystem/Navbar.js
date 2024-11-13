import { Box, Flex, Link } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <Box as="nav" bg="gray.800" color="white" px={4} py={2} position="fixed" top={0} width="100%" zIndex={1}>
      <Flex justifyContent="space-between" align="center">
        <Link as={NavLink} to="/dashboard" p={2} _hover={{ bg: 'gray.700' }}>Dashboard</Link>
        <Link as={NavLink} to="/file-explorer" p={2} _hover={{ bg: 'gray.700' }}>Repository File Explorer</Link>
        <Link as={NavLink} to="/activity-feed" p={2} _hover={{ bg: 'gray.700' }}>Activity Feed</Link>
      </Flex>
    </Box>
  );
};

export default Navbar;
