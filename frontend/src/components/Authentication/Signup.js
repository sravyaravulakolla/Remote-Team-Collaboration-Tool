import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, useToast, VStack, Text, Box } from '@chakra-ui/react'
import axios from 'axios';
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom';

const Signup = () => {
  const [show, setShow] = useState(false);
  const [name, setName] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [confirmPassword, setConfirmPassword] = useState();
  const [pic, setPic] = useState();
  const [githubToken, setGithubToken] = useState(""); // State for GitHub token
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // State for toggling instructions
  const toast = useToast();
  const history = useHistory();

  const handleClick = () => {
    setShow(!show);
  };

  const postDetails = (pic) => {
    console.log("postDetails called with pic:", pic);
    setLoading(true);
    if (pic === undefined) {
      toast({
        title: 'Please select an Image!',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    if (pic.type === "image/jpeg" || pic.type === "image/png") {
      const data = new FormData();
      data.append("file", pic);
      data.append("upload_preset", "samanvay");
      data.append("cloud_name", "sravya");
      console.log("Uploading to Cloudinary...");
      fetch("https://api.cloudinary.com/v1_1/sravya/image/upload", {
        method: "post",
        body: data,
      }).then((res) => res.json())
        .then(data => {
          console.log("Cloudinary response data:", data);
          setPic(data.url.toString());
          setLoading(false);
        })
        .catch((err) => {
          console.error("Cloudinary upload error:", err);
          setLoading(false);
        });
    } else {
      toast({
        title: 'Please select a valid image!',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Log the form data before submission
    console.log("Form submission with data:", { name, email, password, confirmPassword, pic, githubToken });

    if (!name || !email || !password || !confirmPassword || !githubToken) {
      console.log("Missing fields, aborting submission.");
      toast({
        title: 'Please fill all the Fields',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      console.log("Passwords do not match.");
      toast({
        title: 'Passwords do not match',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          "Authorization": `Bearer ${githubToken}`,
        },
      };

      console.log("Sending request to /api/user with config:", config);
      // Send githubToken with the user registration data
      const { data } = await axios.post("/api/user", { name, email, password, pic, githubToken }, config);

      console.log("API response data:", data);

      toast({
        title: 'Registration Successful',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      history.push("/chats");

    } catch (error) {
      console.error("Error during API call:", error);
      toast({
        title: 'Error Occurred!',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  }

  return (
    <VStack spacing={"5px"}>
      <FormControl id="first-name" isRequired>
        <FormLabel>
          Name
        </FormLabel>
        <Input placeholder='Enter your Name' onChange={(e) => setName(e.target.value)} />
      </FormControl>

      <FormControl id="email" isRequired>
        <FormLabel>
          Email
        </FormLabel>
        <Input type="email" placeholder='Enter your Email' onChange={(e) => setEmail(e.target.value)} />
      </FormControl>

      <FormControl id="password" isRequired>
        <FormLabel>
          Password
        </FormLabel>
        <InputGroup size="md">
          <Input type={show ? "text" : "password"} placeholder='Enter your password' onChange={(e) => setPassword(e.target.value)} />
          <InputRightElement width={"4.5rem"}>
            <Button h="1.75rem" size={"sm"} onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl id="confirm-password" isRequired>
        <FormLabel>
          Confirm Password
        </FormLabel>
        <InputGroup size={"md"}>
          <Input type={show ? "text" : "password"} placeholder='Confirm password' onChange={(e) => setConfirmPassword(e.target.value)} />
          <InputRightElement width={"4.5rem"}>
            <Button h="1.75rem" size={"sm"} onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      {/* GitHub Token Input */}
      <FormControl id="github-token" isRequired>
        <FormLabel>
          GitHub Token
        </FormLabel>
        <Input type="text" placeholder='Enter your GitHub Token' onChange={(e) => setGithubToken(e.target.value)} />
      </FormControl>

      {/* Button to toggle GitHub token instructions */}
      <Button variant="link" colorScheme="blue" onClick={() => setShowInstructions(!showInstructions)}>
        How to get your GitHub Token?
      </Button>

      {/* Instructions Box, only visible when the user clicks the button */}
      {showInstructions && (
        <Box mt={2} p={3} borderRadius="md" bg="gray.100" boxShadow="md">
          <Text fontSize="sm">
            To generate your GitHub Token, follow these steps:
            <ol>
              <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: "#3182CE" }}>GitHub Tokens Settings</a>.</li>
              <li>Click on <b>Generate New Token</b> button.</li>
              <li>Select the following scopes or permissions you want to grant the token:</li>
              <ul>
                <li><b>repo</b>: Full control of private repositories.</li>
                <li><b>workflow</b>: Update GitHub Actions workflows.</li>
                <li><b>write:packages</b>: Upload and publish packages to GitHub Packages.</li>
                <li><b>admin:repo_hook</b>: Manage the webhooks for the repository.</li>
                <li><b>user:user:email</b>: Access a user's email address.</li>
              </ul>
              <li>Click <b>Generate Token</b>.</li>
              <li>Copy the token and paste it above.</li>
            </ol>
          </Text>
        </Box>
      )}

      <FormControl id="pic">
        <FormLabel>
          Upload your picture
        </FormLabel>
        <Input type="file" p={1.5} accept='image/*' onChange={(e) => postDetails(e.target.files[0])} />
      </FormControl>

      <Button colorScheme='blue' width={"100%"} style={{ marginTop: 15 }} onClick={submitHandler} isLoading={loading}>
        Sign Up
      </Button>
    </VStack>
  )
}

export default Signup;
