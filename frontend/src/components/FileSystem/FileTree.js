import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Collapse, Text, Heading, Button, VStack, Divider, Icon, Grid } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import FileUpload from './FileUpload';

const FileTree = ({ owner, repo, branch, userId }) => {  // Destructure userId here
  const [treeData, setTreeData] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [errorFetchingContent, setErrorFetchingContent] = useState(false);
  const [openDirs, setOpenDirs] = useState({});

  // Fetch file tree with lazy loading for directories
  const fetchTree = async (path = '') => {
    try {
      const response = await axios.get(`http://localhost:5000/api/repo/${userId}/tree`, {  // Use userId here
        params: { owner, repo, branch, path },
      });

      const items = await Promise.all(
        response.data.map(async (item) => {
          if (item.name === 'node_modules') return null; // Skip node_modules folder

          if (item.type === 'dir') {
            const children = await fetchTree(item.path);
            return {
              name: item.name,
              path: item.path,
              type: item.type,
              children, // Load children on demand
            };
          } else {
            return {
              name: item.name,
              path: item.path,
              type: item.type,
              download_url: item.download_url,
            };
          }
        })
      );

      return items.filter(Boolean);
    } catch (error) {
      console.error('Error fetching file tree:', error.message);
      return [];
    }
  };

  useEffect(() => {
    const loadTree = async () => {
      const tree = await fetchTree();
      setTreeData(tree);
    };

    loadTree();
  }, [owner, repo, branch]);

  // Fetch file content
  const fetchFileContent = async (path) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/repo/${userId}/file`, {  // Use userId here
        params: { owner, repo, branch, path },
      });

      if (response.data && response.data.content) {
        const content = atob(response.data.content);
        setFileContent(content);
        setErrorFetchingContent(false);
      } else {
        setFileContent('No content available.');
        setErrorFetchingContent(true);
      }
    } catch (error) {
      console.error('Error fetching file content:', error.message);
      setFileContent('Error fetching file content.');
      setErrorFetchingContent(true);
    }
  };

  // Handle file click
  const handleFileClick = (path, downloadUrl) => {
    setSelectedFilePath(path);
    fetchFileContent(path);
    setFileUrl(downloadUrl);
  };

  // Handle file download
  const handleDownload = async () => {
    if (!fileUrl) return console.error('No file URL available for download.');

    try {
      const response = await axios.get(fileUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const fileName = selectedFilePath.split('/').pop();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName || 'file.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      console.log(`File downloaded: ${fileName}`);
    } catch (error) {
      console.error('Failed to download file:', error.message);
    }
  };

  // Toggle directory visibility
  const toggleDir = (path) => {
    setOpenDirs((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Render file tree recursively
  const renderTree = (nodes, parentPath = '') => {
    if (!nodes) return null;
    return (
      <VStack align="start" spacing={1} pl={4}>
        {nodes.map((node) => (
          <Box key={node.path} ml={node.type === 'dir' ? 0 : 4}>
            {node.type === 'dir' ? (
              <>
                <Text
                  fontWeight="bold"
                  onClick={() => toggleDir(node.path)}
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  color="black"
                >
                  <Icon as={openDirs[node.path] ? ChevronDownIcon : ChevronRightIcon} boxSize={4} />
                  {node.name}
                </Text>
                <Collapse in={openDirs[node.path]}>
                  {node.children && renderTree(node.children, node.path)}
                </Collapse>
              </>
            ) : (
              <Text
                onClick={() => handleFileClick(node.path, node.download_url)}
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
                color="black"
              >
                {node.name}
              </Text>
            )}
          </Box>
        ))}
      </VStack>
    );
  };

  return (
    <Grid templateColumns="300px 1fr" height="calc(100vh - 64px)" gap={4}>
      <Box className="file-tree-sidebar" overflowY="auto" height="100%" position="relative">
        <Heading mb={4} fontSize="lg" color="teal.500">File Tree</Heading>
        {renderTree(treeData)}
        <FileUpload owner={owner} repo={repo} branch={branch} userId={userId} />
      </Box>
      <Box className="file-content-loaded" overflowY="auto" height="100%" p={4}>
        {selectedFilePath && (
          <>
            <Text fontSize="lg" fontWeight="bold">Content of {selectedFilePath}</Text>
            <Box mt={2} p={4} border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
              <pre>{fileContent}</pre>
            </Box>
            <Divider my={4} />
            {errorFetchingContent && fileUrl && (
              <Button colorScheme="blue" as="a" href={fileUrl} target="_blank" rel="noopener noreferrer">View File</Button>
            )}
            <Button mt={2} colorScheme="teal" onClick={handleDownload}>Download File</Button>
          </>
        )}
      </Box>
    </Grid>
  );
};

export default FileTree;
