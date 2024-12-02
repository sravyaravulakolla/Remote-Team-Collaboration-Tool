import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

const Homepage = () => {
  const history = useHistory();

  useEffect(() => {
    const user = localStorage.getItem("userInfo");
    try {
      const parsedUser = user ? JSON.parse(user) : null;
      if (parsedUser) {
        history.push("/chats");
      }
    } catch (error) {
      console.error("Failed to parse user info from localStorage", error);
      // Optionally remove the corrupted data to prevent future errors
      localStorage.removeItem("userInfo");
    }
  }, [history]);

  return (
    <Container maxW="xl" centerContent>
      <Box
        display="flex"
        justifyContent="center"
        p="3"
        bg={"white"}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
      >
        <Text fontSize="4xl" fontFamily="work sans" color="black">
          Samanvay
        </Text>
      </Box>
      <Box
        bg={"white"}
        w={"100%"}
        p={"4"}
        borderRadius={"lg"}
        borderWidth={"1px"}
      >
        <Tabs isFitted variant="soft-rounded">
          <TabList mb={"1em"}>
            <Tab width={"50%"}>Login</Tab>
            <Tab width={"50%"}>Sign Up</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default Homepage;
