import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Input,
  Button,
  IconButton,
  VStack,
  HStack,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import axios from "axios";
const backendUrl = process.env.REACT_APP_BACKEND_URL;

const TaskManagerAdmin = ({ selectedChat }) => {
  const [phases, setPhases] = useState([]);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newTask, setNewTask] = useState({
    description: "",
    assignedTo: "",
    assignedToName: "",
    dueDate: "",
    status: "pending",
  });
  const [activePhaseIndex, setActivePhaseIndex] = useState(null);

  // Load phases and their tasks on component mount or when selectedChat changes
  useEffect(() => {
    if (selectedChat?._id) {
      fetchPhases();
    }
  }, [selectedChat]);

  // Fetch phases for the selected chat
  const fetchPhases = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/phase/${selectedChat._id}/phases`);
      setPhases(response.data.phases || []);
      // Fetch tasks for each phase after loading phases
      fetchTasksForPhases(response.data.phases);
    } catch (error) {
      console.error("Error fetching phases:", error);
    }
  };

  // Fetch tasks for each phase and update the phases state
  const fetchTasksForPhases = async (phases) => {
    const updatedPhases = [...phases];
    for (let i = 0; i < phases.length; i++) {
      const phaseId = phases[i]._id;
      try {
        const tasksResponse = await axios.get(`${backendUrl}/api/tasks/${phaseId}/tasks`);
        updatedPhases[i].tasks = tasksResponse.data.tasks || [];
      } catch (error) {
        console.error(`Error fetching tasks for phase ${phaseId}:`, error);
      }
    }
    setPhases(updatedPhases);
  };

  // Add a new phase
  const addPhase = async () => {
    if (newPhaseName.trim() !== "") {
      try {
        const response = await axios.post(
          `${backendUrl}/api/phase/${selectedChat._id}/phases`,
          { phaseName: newPhaseName }
        );
        setPhases([...phases, { ...response.data.phase, tasks: [] }]);
        setNewPhaseName("");
      } catch (error) {
        console.error("Error adding phase:", error);
      }
    }
  };

  const updateTaskStatus = async (taskId, phaseIndex, status) => {
    const phaseId = phases[phaseIndex]._id; // Get the phaseId from the selected phase
    try {
      const response = await axios.put(
        `${backendUrl}/api/tasks/${phaseId}/tasks/${taskId}/status`, // Include phaseId in the URL
        { status }  // Ensure status is correctly sent here
      );
  
      // Check the response and update local state
      if (response.data.task) {
        const updatedPhases = [...phases];
        const taskIndex = updatedPhases[phaseIndex].tasks.findIndex(
          (task) => task._id === taskId
        );
        if (taskIndex !== -1) {
          updatedPhases[phaseIndex].tasks[taskIndex].status = response.data.task.status;
        }
        setPhases(updatedPhases);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };
  

  // Add a task to a specific phase
  const addTask = async (phaseIndex) => {
    const phaseId = phases[phaseIndex]._id;
    if (newTask.description.trim()) {
      try {
        const response = await axios.post(`${backendUrl}/api/tasks/${phaseId}/tasks`, {
          ...newTask,
          chatId: selectedChat._id,
        });

        const updatedPhases = [...phases];
        updatedPhases[phaseIndex].tasks.push(response.data.task);
        setPhases(updatedPhases);

        // Reset task form
        setNewTask({
          description: "",
          assignedTo: "",
          assignedToName: "",
          dueDate: "",
          status: "pending",
        });
        setActivePhaseIndex(null);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  // Delete a task
  const deleteTask = async (phaseIndex, taskId) => {
    const phaseId = phases[phaseIndex]._id;
    try {
      await axios.delete(`${backendUrl}/api/tasks/${phaseId}/tasks/${taskId}`);
      const updatedPhases = [...phases];
      updatedPhases[phaseIndex].tasks = updatedPhases[phaseIndex].tasks.filter(task => task._id !== taskId);
      setPhases(updatedPhases);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Toggle status based on current task status
  const handleStatusToggle = async (taskId, phaseIndex, currentStatus) => {
    const nextStatus =
      currentStatus === "pending" ? "in-progress" : currentStatus === "in-progress" ? "completed" : "pending";
    updateTaskStatus(taskId, phaseIndex, nextStatus);
  };

  return (
    <Box display={"flex"} flexDir={"column"} w={"100%"} maxW="1200px" mx="auto">
      <Text pl={{ base: "25%", md: "49%" }} fontSize="xl" fontWeight="bold">
        Tasks
      </Text>

      {/* Phase Creation with "+" Button */}
      <Box mt={4} h={"100%"} display="flex" justifyContent="center">
        <IconButton
          icon={<AddIcon />}
          colorScheme="blue"
          ml={2}
          onClick={() => setActivePhaseIndex("new")}
          aria-label="Add Phase"
          size="sm"
          borderRadius="full"
          _hover={{ bg: "blue.500", transform: "scale(1.1)" }}
          transition="all 0.3s ease"
        />
      </Box>

      {/* Conditional Input to Add New Phase */}
      {activePhaseIndex === "new" && (
        <Box mt={2} display="flex" alignItems="center" justifyContent="center">
          <Input
            placeholder="Enter phase name"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            mr={2}
            borderRadius="md"
            _focus={{ borderColor: "teal.400" }}
            w={{ base: "80%", sm: "60%", md: "40%" }}
          />
          <Button
            colorScheme="blue"
            onClick={addPhase}
            borderRadius="md"
            _hover={{ bg: "blue.600" }}
            _focus={{ outline: "none" }}
            w={{ base: "80%", sm: "60%", md: "auto" }}
          >
            Add Phase
          </Button>
        </Box>
      )}

      {/* Phases with Small "+" Button for Adding Tasks */}
      <VStack align="start" spacing={4} mt={6}>
        {phases.map((phase, index) => (
          <Box
            key={phase._id}
            p={4}
            border="1px solid lightgray"
            borderRadius="md"
            w="100%"
            boxShadow="md"
            _hover={{ boxShadow: "lg", transform: "scale(1.02)" }}
            transition="all 0.3s ease"
          >
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                {phase.phaseName}
              </Text>
              <IconButton
                icon={<AddIcon />}
                size="xs"
                colorScheme="teal"
                onClick={() => setActivePhaseIndex(index)}
                aria-label="Add Task"
                borderRadius="full"
                _hover={{ bg: "teal.500", transform: "scale(1.1)" }}
                transition="all 0.3s ease"
              />
            </HStack>

            {/* Task Creation Form for the Active Phase */}
            {activePhaseIndex === index && (
              <Box mt={2}>
                <Input
                  placeholder="Task Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  mt={2}
                  borderRadius="md"
                  _focus={{ borderColor: "teal.400" }}
                  w="100%"
                />
                <Select
                  placeholder="Assign To"
                  value={newTask.assignedTo}
                  onChange={(e) => {
                    const selectedUserId = e.target.value;
                    const selectedUser = selectedChat.users.find(
                      (user) => user._id === selectedUserId
                    );
                    setNewTask({
                      ...newTask,
                      assignedTo: selectedUserId,
                      assignedToName: selectedUser?.name || "",
                    });
                  }}
                  mt={2}
                  borderRadius="md"
                  _focus={{ borderColor: "teal.400" }}
                  w="100%"
                >
                  {selectedChat.users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  mt={2}
                  borderRadius="md"
                  _focus={{ borderColor: "teal.400" }}
                  w="100%"
                />
                <Button
                  colorScheme="blue"
                  onClick={() => addTask(index)}
                  mt={4}
                  w="100%"
                  borderRadius="md"
                  _hover={{ bg: "blue.600" }}
                >
                  Add Task
                </Button>
              </Box>
            )}

            {/* Task List */}
            <Box mt={4}>
              {phase.tasks?.map((task) => (
                <Box
                  key={task._id}
                  p={2}
                  mt={2}
                  border="1px solid lightgray"
                  borderRadius="md"
                  boxShadow="sm"
                  display="flex"
                  flexDirection={{ base: "column", md: "row" }}  // Stack vertically on mobile
                  justifyContent="space-between"
                  _hover={{ boxShadow: "md", transform: "scale(1.02)" }}
                  transition="all 0.3s ease"
                >
                  <Box>
                    <Text>
                      <strong>Task:</strong> {task.description}
                    </Text>
                    <Text>
                      <strong>Assigned To:</strong> {task.assignedToName || "Not Assigned"}
                    </Text>
                    <Text>
                      <strong>Due Date:</strong> {task.dueDate}
                    </Text>
                  </Box>

                  <Box ml="auto" display="flex" alignItems="center">
                    <Menu>
                      <MenuButton as={Button} colorScheme="teal" mt={2} borderRadius="md">
                        {task.status || "Pending"}
                      </MenuButton>
                      <MenuList>
                        <MenuItem onClick={() => updateTaskStatus(task._id, index, "pending")}>
                          Pending
                        </MenuItem>
                        <MenuItem onClick={() => updateTaskStatus(task._id, index, "in-progress")}>
                          In Progress
                        </MenuItem>
                        <MenuItem onClick={() => updateTaskStatus(task._id, index, "completed")}>
                          Completed
                        </MenuItem>
                      </MenuList>
                    </Menu>

                    <Button
                      colorScheme="red"
                      size="sm"
                      ml={4}
                      mt={2}
                      onClick={() => deleteTask(index, task._id)}
                      borderRadius="md"
                      _hover={{ bg: "red.500" }}
                    >
                      Delete Task
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default TaskManagerAdmin;
