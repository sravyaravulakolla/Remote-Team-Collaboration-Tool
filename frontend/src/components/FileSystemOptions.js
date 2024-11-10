// FileSystemOptions.js
import React from 'react';
import { Box, Grid, GridItem, Button, Text } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const FileSystemOptions = ({ onSelectOption }) => {
  return (
    <Box p={4} border="1px" borderRadius="md" borderColor="gray.200">
      <Text fontSize="2xl" mb={4}>File System Options</Text>

      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        {/* Option: Dashboard */}
        <GridItem>
          <Button
            onClick={() => onSelectOption('Dashboard')}
            colorScheme="teal"
            w="100%"
            _hover={{ bg: 'teal.600' }}
            _active={{ bg: 'teal.700' }}
            aria-label="Select Dashboard"
          >
            Dashboard
          </Button>
        </GridItem>

        {/* Option: Repository File Explorer */}
        <GridItem>
          <Button
            onClick={() => onSelectOption('FileExplorer')}
            colorScheme="blue"
            w="100%"
            _hover={{ bg: 'blue.600' }}
            _active={{ bg: 'blue.700' }}
            aria-label="Select Repository File Explorer"
          >
            Repository File Explorer
          </Button>
        </GridItem>

        {/* Option: Activity Feed */}
        <GridItem>
          <Button
            onClick={() => onSelectOption('ActivityFeed')}
            colorScheme="orange"
            w="100%"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            aria-label="Select Activity Feed"
          >
            Activity Feed
          </Button>
        </GridItem>
      </Grid>
    </Box>
  );
};

// Validate prop types
FileSystemOptions.propTypes = {
  onSelectOption: PropTypes.func.isRequired,  // Ensure onSelectOption is passed as a function
};

export default FileSystemOptions;
