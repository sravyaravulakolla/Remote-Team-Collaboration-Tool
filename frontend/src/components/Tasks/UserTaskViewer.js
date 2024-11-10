import React, { useState, useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import axios from "axios";

const UserTaskViewer = ({ selectedChat, user }) => {
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    if (selectedChat?._id) {
      fetchPhases();
    }
  }, [selectedChat]);

  const fetchPhases = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/phase/${selectedChat._id}`);
      setPhases(response.data.phases || []);
    } catch (error) {
      console.error("Error fetching phases:", error);
    }
  };

  return (
    <Box display={"flex"} flexDir={"column"} w={"100%"}>
      <Text pl={"49%"} fontSize="xl" fontWeight="bold">
        Your Tasks
      </Text>

      {/* Display Phases with Tasks Assigned to the Current User */}
      <Box mt={6}>
        {phases.map((phase) => (
          <Box
            key={phase._id}
            p={4}
            border="1px solid lightgray"
            borderRadius="md"
            w="full"
            mb={4}
          >
            <Text fontSize="lg" fontWeight="bold">
              {phase.phaseName}
            </Text>

            <Box mt={2}>
              <Text fontSize="md" fontWeight="bold">
                Tasks Assigned to You
              </Text>

              {/* Make sure phase.tasks is defined and then filter */}
              {phase.tasks?.filter((task) => task.assignedTo === user._id).length === 0 ? (
                <Text color="gray.500">No tasks assigned to you in this phase.</Text>
              ) : (
                phase.tasks
                  .filter((task) => task.assignedTo === user._id)
                  .map((task) => (
                    <Box
                      key={task._id}
                      p={2}
                      mt={2}
                      border="1px solid lightgray"
                      borderRadius="md"
                    >
                      <Text>
                        <strong>Task:</strong> {task.description}
                      </Text>
                      <Text>
                        <strong>Due Date:</strong> {task.dueDate}
                      </Text>
                    </Box>
                  ))
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserTaskViewer;
