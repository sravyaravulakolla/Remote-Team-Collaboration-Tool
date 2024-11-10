import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Text, List, ListItem, Spinner } from '@chakra-ui/react';

const ActivityFeed = ({ selectedBranch, chatId, userId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivity = async () => {
      if (!selectedBranch) {
        setError('Branch must be selected.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch repo details using chatId (as done in FileExplorer)
        const { data: repoResponse } = await axios.get(`http://localhost:5000/api/repo/${chatId}/repodetails`);
        const { owner, repositoryName } = repoResponse;
        
        // Fetch commit data based on repo details and selectedBranch
        const response = await axios.get(`http://localhost:5000/api/repo/${userId}/commits`, {
          params: { owner, repositoryName, branch: selectedBranch }
        });

        setActivities(response.data);
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError('Failed to fetch activity.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [selectedBranch, chatId]); // Fetch again when selectedBranch or chatId changes

  return (
    <Box p={4} borderWidth={1} borderRadius="md" shadow="md">
      {loading ? (
        <Box display="flex" alignItems="center">
          <Spinner mr={2} />
          <Text>Loading activities...</Text>
        </Box>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : activities.length === 0 ? (
        <Text>No activity found</Text>
      ) : (
        <List spacing={3}>
          {activities.map((commit) => (
            <ListItem key={commit.sha} borderWidth={1} borderRadius="md" p={2}>
              <Text fontWeight="bold">{commit.commit.message}</Text>
              <Text fontSize="sm" color="gray.500">
                {commit.commit.author.name} - {new Date(commit.commit.author.date).toLocaleString()}
              </Text>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ActivityFeed;
