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
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import axios from "axios";

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
      const response = await axios.get(`http://localhost:5000/api/phase/${selectedChat._id}/phases`);
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
        const tasksResponse = await axios.get(`http://localhost:5000/api/tasks/${phaseId}/tasks`);
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
          `http://localhost:5000/api/phase/${selectedChat._id}/phases`,
          { phaseName: newPhaseName }
        );
        setPhases([...phases, { ...response.data.phase, tasks: [] }]);
        setNewPhaseName("");
      } catch (error) {
        console.error("Error adding phase:", error);
      }
    }
  };

  // Add a task to a specific phase
  const addTask = async (phaseIndex) => {
    const phaseId = phases[phaseIndex]._id;
    if (newTask.description.trim()) {
      try {
        const response = await axios.post(`http://localhost:5000/api/tasks/${phaseId}/tasks`, {
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
      await axios.delete(`http://localhost:5000/api/tasks/${phaseId}/tasks/${taskId}`);
      const updatedPhases = [...phases];
      updatedPhases[phaseIndex].tasks = updatedPhases[phaseIndex].tasks.filter(task => task._id !== taskId);
      setPhases(updatedPhases);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <Box display={"flex"} flexDir={"column"} w={"100%"}>
      <Text pl={"49%"} fontSize="xl" fontWeight="bold">
        Tasks
      </Text>

      {/* Phase Creation with "+" Button */}
      <Box mt={4} h={"100%"} display="flex" alignItems="center">
        <IconButton
          icon={<AddIcon />}
          colorScheme="blue"
          ml={2}
          onClick={() => setActivePhaseIndex("new")}
          aria-label="Add Phase"
          size="sm"
        />
      </Box>

      {/* Conditional Input to Add New Phase */}
      {activePhaseIndex === "new" && (
        <Box mt={2} display="flex" alignItems="center">
          <Input
            placeholder="Enter phase name"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            mr={2}
          />
          <Button colorScheme="blue" onClick={addPhase}>
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
            w="full"
          >
            <HStack>
              <Text fontSize="lg" fontWeight="bold">
                {phase.phaseName}
              </Text>
              <IconButton
                icon={<AddIcon />}
                size="xs"
                colorScheme="teal"
                onClick={() => setActivePhaseIndex(index)}
                aria-label="Add Task"
              />
            </HStack>

            {/* Task Creation Form for the Active Phase */}
            {activePhaseIndex === index && (
              <Box mt={2}>
                <Input
                  placeholder="Task Description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  mt={2}
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
                >
                  {selectedChat.users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  mt={2}
                />
                <Button
                  colorScheme="teal"
                  mt={2}
                  onClick={() => addTask(index)}
                >
                  Add Task to {phase.phaseName}
                </Button>
              </Box>
            )}

            {/* Display Tasks within Each Phase */}
            <Box mt={4}>
              <Text fontSize="md" fontWeight="bold">
                Tasks in {phase.phaseName}
              </Text>
              {phase.tasks?.length > 0 ? (
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
                      <strong>Assigned To:</strong> {task.assignedToName || "Not Assigned"}
                    </Text>
                    <Text>
                      <strong>Due Date:</strong> {task.dueDate}
                    </Text>
                    <Button
                      colorScheme="red"
                      size="sm"
                      mt={2}
                      onClick={() => deleteTask(index, task._id)}
                    >
                      Delete Task
                    </Button>
                  </Box>
                ))
              ) : (
                <Text color="gray.500">No tasks added yet.</Text>
              )}
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default TaskManagerAdmin;
