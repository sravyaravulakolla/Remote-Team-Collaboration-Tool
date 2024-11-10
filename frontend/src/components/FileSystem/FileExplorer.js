import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import { Box, Spinner, Text } from '@chakra-ui/react';
import axios from 'axios';

const FileExplorer = ({ selectedBranch, chatId, userId }) => {  
  const [repoInfo, setRepoInfo] = useState({ owner: '', repo: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepoInfo = async () => {
      try {
        setLoading(true);
        // Fetch repo details using chatId (which is passed from parent)
        const { data: repoResponse } = await axios.get(`http://localhost:5000/api/repo/${chatId}/repodetails`);
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
  }, [selectedBranch,chatId]); // Re-fetch when chatId changes

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" />
        <Text ml={4}>Loading repository details...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} color="red.500" textAlign="center">
        <Text>{error}</Text>
      </Box>
    );
  }

  if (!userId) {
    return (
      <Box p={4} color="red.500" textAlign="center">
        <Text>User information is missing or invalid.</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      {/* Render the FileTree component with repo info, branch, and userId */}
      {repoInfo.owner && repoInfo.repo && (
        <FileTree owner={repoInfo.owner} repo={repoInfo.repo} branch={selectedBranch} userId={userId} />
      )}
    </Box>
  );
};

export default FileExplorer;
