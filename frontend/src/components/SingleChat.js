import React, { useEffect, useState } from "react";
import { useChatState } from "../Context/ChatProvider";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon, CloseIcon, PhoneIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import FileSystemOptions from './FileSystemOptions';
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import Lottie from 'react-lottie';
import animationData from "../animations/typing.json";
import { useHistory } from "react-router-dom";
import Dashboard from './FileSystem/Dashboard';
import FileExplorer from './FileSystem/FileExplorer';
import ActivityFeed from './FileSystem/ActivityFeed';

const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState('');  // Track the selected option (Dashboard, FileExplorer, ActivityFeed)
  const [selectedBranch, setSelectedBranch] = useState(''); // Set the selected branch
  const [messages, setMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isRinging, setIsRinging] = useState(false); // For showing ringing notification
  const { user, selectedChat, setSelectedChat, notifications, setNotifications } = useChatState();
  const toast = useToast();

  const history = useHistory();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));

    // Ring event when call is initiated
    socket.on("ring", () => {
      setIsRinging(true);
      setTimeout(() => setIsRinging(false), 30000); // Ring timeout 30s
    });

    socket.on("join call", () => setIsInCall(true));
    socket.on("call end", () => setIsInCall(false));
  }, [user]);

  const handleCallToggle = () => {
    if (!isInCall) {
      const videoCallUrl = `/video-call/${selectedChat._id}`;
      window.open(videoCallUrl, "_blank"); // Open video call in a new tab
    }
    setIsInCall(!isInCall);
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => {
      setSocketConnected(true);
    });
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load the messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
        if (!notifications.includes(newMessageReceived)) {
          setNotifications([newMessageReceived, ...notifications]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
    }
    socket.emit("typing", selectedChat._id);
    let lastTypingTime = new Date().getTime();
    const timeLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timeLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timeLength);
  };

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <Tabs variant="soft-rounded" colorScheme="orange" flex="1">
        <TabList>
          <Tab>Chat</Tab>
          <Tab>File System</Tab>
        </TabList>

        <TabPanels flex="1">
          {/* Chat Tab */}
          <TabPanel height="100%">
            {selectedChat ? (
              <>
                <Text
                  fontSize="30px"
                  pb={3}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <IconButton icon={<ArrowBackIcon />} onClick={() => setSelectedChat("")} />
                  {isRinging && <Text>Ringing...</Text>}
                  <Button onClick={handleCallToggle} colorScheme={isInCall ? "red" : "blue"} ml={4}>
                    {isInCall ? <CloseIcon boxSize={6} /> : <PhoneIcon boxSize={6} />}
                  </Button>
                  {!selectedChat.isGroupChat ? getSender(user, selectedChat.users) : selectedChat.chatName.toUpperCase()}
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                  {selectedChat.isGroupChat && <UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
                </Text>

                <Box bg="#E8E8E8" p={3} w="100%" borderRadius="lg" overflowY="hidden" flex="1">
                  {loading ? (
                    <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
                  ) : (
                    <ScrollableChat messages={messages} />
                  )}
                  <FormControl onKeyDown={sendMessage} isRequired mt={3}>
                    {isTyping && <Lottie options={defaultOptions} width={70} />}
                    <Input
                      variant="filled"
                      bg="#E0E0E0"
                      placeholder="Enter a message..."
                      onChange={typingHandler}
                      value={newMessage}
                    />
                  </FormControl>
                </Box>
              </>
            ) : (
              <Text fontSize="3xl">Click on a user to start chatting</Text>
            )}
          </TabPanel>

          {/* File System Tab */}
          <TabPanel>
            <FileSystemOptions  
              onSelectOption={(option) => {
                setSelectedTab(option);
                console.log("Selected option:", option); // Log to confirm
                console.log("user:", user._id);
              }}
            />
            {/* Render the appropriate component based on selected option */}
            {selectedTab === 'Dashboard' && selectedChat && <Dashboard chatId={selectedChat._id} onBranchChange={setSelectedBranch} />}
            {selectedTab === 'FileExplorer' && selectedChat && <FileExplorer chatId={selectedChat._id} userId={user._id} selectedBranch={selectedBranch} />}
            {selectedTab === 'ActivityFeed' && selectedChat &&<ActivityFeed chatId={selectedChat._id} userId={user._id} selectedBranch={selectedBranch} />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SingleChat;
