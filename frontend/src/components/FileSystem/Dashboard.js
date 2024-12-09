import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Select, Box, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
const backendUrl = process.env.REACT_APP_BACKEND_URL;

const Dashboard = ({ chatId, onBranchChange }) => {
  const [branches, setBranches] = useState([]); // To store the fetched branches
  const [repoInfo, setRepoInfo] = useState({ owner: '', repo: '' }); // To store repository owner and name
  const [loading, setLoading] = useState(true); // To manage loading state
  const [error, setError] = useState(null); // To handle error messages

  useEffect(() => {
    // Fetch the repository details (owner, repo name, and branches)
    const fetchRepoData = async () => {
      setLoading(true);
      setError(null); // Reset error state before fetching data

      try {
        // First, fetch the repository details (owner, repository name)
        const response = await axios.get(`${backendUrl}/api/repo/${chatId}/repodetails`);
        const { owner, repositoryName } = response.data; // Destructure the response

        // Set repo info (owner and repo name)
        setRepoInfo({ owner, repo: repositoryName });

        // Fetch the branches based on the chatId, which will trigger the backend logic
        const branchesResponse = await axios.get(`${backendUrl}/api/repo/${chatId}/branches`);
        setBranches(branchesResponse.data); // Set branches state

        setLoading(false); // Set loading to false once data is fetched
      } catch (error) {
        setError('Failed to fetch repository details or branches.');
        console.error('Error fetching data:', error);
        setLoading(false); // Set loading to false even if there’s an error
      }
    };

    if (chatId) {
      fetchRepoData(); // Fetch repo details and branches when chatId changes
      console.log("Fetching data for chatId:", chatId);
    }
  }, [chatId]); // Dependency on chatId to re-fetch if chatId changes

  const handleBranchChange = (event) => {
    const selectedBranch = event.target.value;
    onBranchChange(selectedBranch); // Pass the selected branch back to the parent component
  };

  return (
    <Box>
      <Text fontSize="2xl" mb={4}>
        Select a Branch
      </Text>

      {loading && <Spinner size="xl" />}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!loading && !error && branches.length > 0 && (
        <Select placeholder="Select branch" onChange={handleBranchChange}>
          {branches.map((branch) => (
            <option key={branch.name} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </Select>
      )}

      {!loading && !error && branches.length === 0 && (
        <Text>No branches found for this repository.</Text>
      )}
    </Box>
  );
};

export default Dashboard;
