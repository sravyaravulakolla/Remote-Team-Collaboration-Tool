import React, { useState } from 'react';
import {
  Box,
  Heading,
  Input,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import FolderSelector from './FolderSelector';
import axios from 'axios';
const backendUrl = process.env.REACT_APP_BACKEND_URL;

const FileUpload = ({ owner, repo, branch, userId }) => {  // Added userId here
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFolder, setSelectedFolder] = useState('');
  const [file, setFile] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const toast = useToast();

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder.path); // Update selected folder path
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  
    // Prepare the form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', selectedFolder ? `${selectedFolder}` : ``);
    formData.append('commitMessage', commitMessage);
    formData.append('owner', owner);
    formData.append('repo', repo);
    formData.append('branch', branch);
    formData.append('userId', userId);  // Pass the userId for API call
  
    try {
      const response = await axios.post(`${backendUrl}/api/repo/${userId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      toast({
        title: 'File uploaded successfully.',
        description: `File: ${response.data.filePath || file.name} uploaded to ${selectedFolder || 'root directory'}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Upload error:', error); // Log the error
      toast({
        title: 'Error uploading file.',
        description: error.response?.data?.error || 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  
  
  };

  return (
    <Box p={4} maxWidth="500px" mx="auto">
      <Heading mb={4} fontSize="lg" color="teal.500">Upload File</Heading>

      {/* Button to select folder */}
      <Button onClick={onOpen} mb={4}>Select Folder</Button>
      <p>Selected Folder: {selectedFolder ? selectedFolder : 'Root Directory'}</p> {/* Indicating root if no folder selected */}

      {/* Modal for folder selection */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select a Folder</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FolderSelector owner={owner} repo={repo} branch={branch} userId={userId} onSelect={handleFolderSelect} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* File input */}
      <Input type="file" onChange={handleFileChange} mb={4} />

      {/* Commit message input */}
      <Input
        placeholder="Commit message"
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        mb={4}
      />

      {/* Upload button */}
      <Button colorScheme="blue" onClick={handleUpload} isDisabled={!file}>
        Upload
      </Button>
    </Box>
  );
};

export default FileUpload;
