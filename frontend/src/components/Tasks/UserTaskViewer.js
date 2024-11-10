import React, { useState, useEffect } from "react";
import { Box, Text, Button, Menu, MenuButton, MenuList, MenuItem, Spinner } from "@chakra-ui/react";
import axios from "axios";

const UserTaskViewer = ({ selectedChat, user }) => {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    if (selectedChat?._id && user?._id) {
      fetchPhases();
    }
  }, [selectedChat, user]);

  const fetchPhases = async () => {
    try {
      setLoading(true);
      setError(null); // Reset any previous errors

      // Fetch phases for the selected chat
      const response = await axios.get(`http://localhost:5000/api/phase/${selectedChat._id}/phases`);
      const phasesData = response.data.phases || [];

      // Fetch tasks for each phase and filter tasks assigned to the current user
      const updatedPhases = await Promise.all(
        phasesData.map(async (phase) => {
          const tasksResponse = await axios.get(`http://localhost:5000/api/tasks/${phase._id}/tasks`);
          const filteredTasks = tasksResponse.data.tasks.filter((task) => {
            return task.assignedTo.toString() === user._id.toString(); // Ensure both are strings for comparison
          });
          return { ...phase, tasks: filteredTasks }; // Add only the assigned tasks
        })
      );

      setPhases(updatedPhases);
    } catch (error) {
      console.error("Error fetching phases:", error);
      setError("Failed to fetch tasks or phases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle task status update
  const handleStatusUpdate = async (taskId, phaseId, status) => {
    try {
      // Send the updated status to the backend
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${phaseId}/tasks/${taskId}/status`,
        { status }
      );

      // Update the task's status in the local state
      const updatedPhases = [...phases];
      const phaseIndex = updatedPhases.findIndex((phase) => phase._id === phaseId);
      const taskIndex = updatedPhases[phaseIndex].tasks.findIndex((task) => task._id === taskId);
      updatedPhases[phaseIndex].tasks[taskIndex].status = response.data.task.status;

      setPhases(updatedPhases);
    } catch (error) {
      console.error("Error updating task status:", error);
      setError("Failed to update task status. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box display={"flex"} flexDir={"column"} w={"100%"}>
      <Text pl={"49%"} fontSize="xl" fontWeight="bold">
        Your Tasks
      </Text>

      {/* Display error message if any */}
      {error && (
        <Box mt={4} p={4} color="red.500" border="1px solid red" borderRadius="md">
          <Text>{error}</Text>
        </Box>
      )}

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

                      {/* Task Status Update Menu */}
                      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                        <Menu>
                          <MenuButton as={Button} colorScheme="teal" borderRadius="md">
                            {task.status || "Pending"}
                          </MenuButton>
                          <MenuList>
                            <MenuItem onClick={() => handleStatusUpdate(task._id, phase._id, "pending")}>
                              Pending
                            </MenuItem>
                            <MenuItem onClick={() => handleStatusUpdate(task._id, phase._id, "in-progress")}>
                              In Progress
                            </MenuItem>
                            <MenuItem onClick={() => handleStatusUpdate(task._id, phase._id, "completed")}>
                              Completed
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Box>
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
