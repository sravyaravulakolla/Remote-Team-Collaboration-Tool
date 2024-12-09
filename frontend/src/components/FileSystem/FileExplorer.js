import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import { Box, Spinner, Text, Center, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';
import axios from 'axios';
const backendUrl = process.env.REACT_APP_BACKEND_URL;

const FileExplorer = ({ selectedBranch, chatId, userId }) => {  
  const [repoInfo, setRepoInfo] = useState({ owner: '', repo: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepoInfo = async () => {
      try {
        setLoading(true);
        // Fetch repo details using chatId (which is passed from parent)
        const { data: repoResponse } = await axios.get(`${backendUrl}/api/repo/${chatId}/repodetails`);
        const { owner, repositoryName } = repoResponse;

        setRepoInfo({ owner, repo: repositoryName });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching repo info:', error);
        setError('Failed to load repository information');
        setLoading(false);
      }
    };

    fetchRepoInfo();
  }, [selectedBranch, chatId]); // Re-fetch when chatId changes

  if (loading) {
    return (
      <Center p={6}>
        <Box textAlign="center">
          <Spinner size="xl" color="teal.500" />
          <Text mt={4} fontSize="lg" fontWeight="medium">Loading repository details...</Text>
        </Box>
      </Center>
    );
  }

  if (error) {
    return (
      <Center p={6}>
        <Alert status="error" variant="left-accent" borderRadius="md" width="full" maxWidth="600px">
          <AlertIcon />
          <Box>
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Center>
    );
  }

  if (!userId) {
    return (
      <Center p={6}>
        <Alert status="warning" variant="left-accent" borderRadius="md" width="full" maxWidth="600px">
          <AlertIcon />
          <Box>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>User information is missing or invalid.</AlertDescription>
          </Box>
        </Alert>
      </Center>
    );
  }

  return (
    <Box p={4} bg="gray.50" borderRadius="lg" boxShadow="sm">
      {/* Render the FileTree component with repo info, branch, and userId */}
      {repoInfo.owner && repoInfo.repo && (
        <FileTree 
          owner={repoInfo.owner} 
          repo={repoInfo.repo} 
          branch={selectedBranch} 
          userId={userId} 
        />
      )}
    </Box>
  );
};

export default FileExplorer;
