// Components/NotFound.js
import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const NotFound = () => {
  return (
    <Box p={4}>
      <Text fontSize="2xl" color="red.500">404 - Page Not Found</Text>
    </Box>
  );
};

export default NotFound;
