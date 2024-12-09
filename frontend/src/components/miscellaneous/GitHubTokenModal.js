import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
  VStack,
  MenuItem,
} from "@chakra-ui/react";
import React, { useState } from "react";
import axios from "axios";

const GitHubTokenModal = ({ user }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newGithubToken, setNewGithubToken] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleUpdateToken = async () => {
    if (!newGithubToken) {
      toast({
        title: "GitHub Token is required",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.githubToken}`, // Current token for authorization
        },
      };

      // Make a PUT request to update the token in the backend
      const { data } = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/repo/${user._id}/update-token`,
        { githubToken: newGithubToken },
        config
      );

      // Update the user object with the new token
      // updateUser(data);  // If you want to update the user state, uncomment this line

      toast({
        title: "GitHub Token Updated Successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MenuItem to open the Modal */}
      <MenuItem onClick={onOpen}>Update GitHub Token</MenuItem>

      {/* GitHub Token Modal */}
      <Modal size={"md"} isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize={"30px"} fontFamily={"Work Sans"} textAlign="center">
            Update GitHub Token
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="md" textAlign="center">
                Enter your new GitHub Token below to update.
              </Text>
              <Input
                placeholder="New GitHub Token"
                value={newGithubToken}
                onChange={(e) => setNewGithubToken(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateToken} isLoading={loading}>
              Update
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GitHubTokenModal;
