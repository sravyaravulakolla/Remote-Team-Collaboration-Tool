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
      // Fetch phases for the selected chat
      const response = await axios.get(`http://localhost:5000/api/phase/${selectedChat._id}/phases`);
      const phasesData = response.data.phases || [];

      console.log("Fetched Phases:", phasesData); // Debugging: Log fetched phases

      // Fetch tasks for each phase and filter tasks assigned to the current user
      const updatedPhases = await Promise.all(
        phasesData.map(async (phase) => {
          const tasksResponse = await axios.get(`http://localhost:5000/api/tasks/${phase._id}/tasks`);
          const filteredTasks = tasksResponse.data.tasks.filter((task) => {
            console.log("Task Assigned To:", task.assignedTo); // Debugging: Log task assignedTo
            console.log("Current User ID:", user._id); // Debugging: Log current user ID
            return task.assignedTo.toString() === user._id.toString(); // Ensure both are strings for comparison
          });
          return { ...phase, tasks: filteredTasks }; // Add only the assigned tasks
        })
      );

      console.log("Updated Phases with Tasks:", updatedPhases); // Debugging: Log updated phases with filtered tasks

      setPhases(updatedPhases);
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
        {phases.length === 0 ? (
          <Text color="gray.500">No phases or tasks assigned to you yet.</Text>
        ) : (
          phases.map((phase) => (
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

                {/* Make sure phase.tasks is defined and then display assigned tasks */}
                {phase.tasks?.length === 0 ? (
                  <Text color="gray.500">No tasks assigned to you in this phase.</Text>
                ) : (
                  phase.tasks.map((task) => (
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
          ))
        )}
      </Box>
    </Box>
  );
};

export default UserTaskViewer;
