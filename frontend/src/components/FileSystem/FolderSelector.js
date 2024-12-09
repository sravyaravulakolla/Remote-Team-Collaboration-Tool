import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, VStack } from '@chakra-ui/react';
const backendUrl = process.env.REACT_APP_BACKEND_URL;

const FolderSelector = ({ owner, repo, branch, userId, onSelect }) => {
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [currentPath, setCurrentPath] = useState(''); // Track current path for fetching subdirectories
    const [loading, setLoading] = useState(false); // Track loading state

    // Effect to fetch folder data when the path or other dependencies change
    useEffect(() => {
        fetchFolders(currentPath); // Fetch folders on mount and when currentPath changes
    }, [owner, repo, branch, currentPath, userId]);

    const fetchFolders = async (path) => {
        if (!owner || !repo || !branch || !userId) {
            console.error('Missing parameters:', { owner, repo, branch, userId });
            return;
        }

        setLoading(true); // Start loading

        try {
            // const s='/api/repo/' + userId + '/tree';
            // console.log('s',s);
            const response = await axios.get(backendUrl+'/api/repo/' + userId + '/folders', {
                params: { owner, repo, branch, path },
            });

            // Filter out null or undefined items if there are any
            const folderData = response.data.filter(item => item !== null);

            setFolders(folderData); // Update folder list with the response data
        } catch (error) {
            console.error('Error fetching folders:', error);
            setFolders([]); // Clear folders in case of an error
        } finally {
            setLoading(false); // End loading
        }
    };

    // Handle folder selection and update path for subfolder navigation
    const handleFolderSelect = (folder) => {
        if (selectedFolder === folder.path) {
            // If the folder is already selected, you might want to clear the selection
            setSelectedFolder('');
            onSelect(null);
        } else {
            setSelectedFolder(folder.path); // Store the selected folder path
            onSelect(folder); // Notify the parent component of the selection
            setCurrentPath(folder.path); // Update the path to fetch subdirectories
        }
    };

    return (
        <VStack spacing={2} align="stretch">
            {loading && <Button variant="solid" colorScheme="teal" isLoading width="full">Loading...</Button>}
            
            {folders.length === 0 && !loading && (
                <Button variant="outline" colorScheme="gray" width="full" isDisabled>No Folders Available</Button>
            )}

            {folders.map((folder) => (
                <Button
                    key={folder.path}
                    onClick={() => handleFolderSelect(folder)}
                    variant={selectedFolder === folder.path ? 'solid' : 'outline'}
                    colorScheme="blue"
                    width="full"
                >
                    {folder.name}
                </Button>
            ))}
        </VStack>
    );
};

export default FolderSelector;
