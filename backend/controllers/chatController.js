const axios = require('axios');
const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const crypto = require("crypto");
const secretKey = Buffer.from(process.env.SECRET_KEY, "hex");
// Decrypt the token using the secret key
const decryptToken = (encryptedToken) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    secretKey,
    Buffer.alloc(16, 0)
  ); // Ensure 16-byte IV for CBC mode
  let decrypted = decipher.update(encryptedToken, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } }
    ]
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  }
  else{
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
  }
  try {
    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
    res.status(200).send(fullChat);
  } catch (error) {
    res.status(400).send({ message: error.message });
    throw new Error(error.message);
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  try {
    const results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const populatedResults = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).send(populatedResults);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});



const getGitHubUsername = async (encryptedToken) => {
  try {
    const decryptedToken = decryptToken(encryptedToken); // Decrypt the token
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
        'Content-Type': 'application/json',
      },
    });
    const githubUsername = response.data.login;
    return githubUsername;
  } catch (error) {
    console.error("Error fetching GitHub username:", error.message);
    throw new Error("Failed to fetch GitHub username");
  }
};

const createGroupChat = asyncHandler(async (req, res) => {
  // Validate: Ensure all fields are provided
  if (!req.body.users || !req.body.name || !req.body.repoName) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  try {
    // Step 1: Get the full user details, including githubToken
    const usersWithDetails = await User.find({ _id: { $in: req.body.users } }).select('githubToken _id name');
    console.log('Users with populated details:', usersWithDetails);
    const decryptedOwnerToken = decryptToken(req.user.githubToken); // Decrypt owner's token


    // Step 3: Get the GitHub username of the current user (the owner)
    const githubUsername = await getGitHubUsername(req.user.githubToken);
    console.log("GitHub Username (Owner):", githubUsername);

    // Step 4: Create the GitHub repository
    const repoData = {
      name: req.body.repoName,
      private: true,
    };

    const createRepoResponse = await axios.post(
      `https://api.github.com/user/repos`,
      repoData,
      {
        headers: {
          Authorization: `Bearer ${decryptedOwnerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const repoName = createRepoResponse.data.name;
    console.log("Repository Created:", repoName);

    // Step 5: Add each user to the repository as a collaborator
    const addCollaboratorsPromises = usersWithDetails.map(async (user) => {
      if (user.githubToken) {
        const eachGithubUsername = await getGitHubUsername(user.githubToken);
        console.log("Adding collaborator:", eachGithubUsername);

        const addCollaboratorUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/collaborators/${eachGithubUsername}`;

        const response = await axios.put(
          addCollaboratorUrl,
          {},
          {
            headers: {
              Authorization: `Bearer ${decryptedOwnerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('Collaborator added successfully:', response.status, response.data);
      } else {
        console.warn(`User ${user.name} does not have a valid GitHub token.`);
      }
    });

    // Wait for all collaborator addition promises to finish
    await Promise.all(addCollaboratorsPromises);
    console.log("All collaborators processed.");

    // Step 6: Create an initial commit (e.g., a README.md file) to initialize the 'main' branch
    const createInitialCommit = async () => {
      const newFile = {
        message: 'Initial commit',
        content: Buffer.from('# New Repo\nThis is a new repository').toString('base64'),  // Base64-encoded content of README.md
      };

      const response = await axios.put(
        `https://api.github.com/repos/${githubUsername}/${repoName}/contents/README.md`,
        newFile,
        {
          headers: {
            Authorization: `Bearer ${decryptedOwnerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Initial commit created successfully:', response.data.commit.sha);
    };

    await createInitialCommit();  // Call this function to create the first commit

    // Step 7: Create branches for each user
    const userBranchNames = {}; // Track the count of users with the same name to ensure uniqueness

    const createBranchesPromises = usersWithDetails.map(async (user) => {
      let branchName = `${user.name.replace(/\s+/g, '-').toLowerCase()}-branch`; // Example: john-doe-branch

      // Check if a branch with this name already exists for this user
      if (userBranchNames[branchName]) {
        branchName = `${branchName}-${userBranchNames[branchName]}`; // Append a number if branch name is not unique
        userBranchNames[branchName] = userBranchNames[branchName] + 1;
      } else {
        userBranchNames[branchName] = 1; // Start with the first occurrence of the branch
      }

      // Step 7.1: Fetch the latest commit SHA from the base branch ('main')
      const baseBranchResponse = await axios.get(
        `https://api.github.com/repos/${githubUsername}/${repoName}/git/refs/heads/main`,
        {
          headers: {
            Authorization: `Bearer ${decryptedOwnerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const sha = baseBranchResponse.data.object.sha;

      // Step 7.2: Create the new branch using the SHA of the 'main' branch
      const createBranchUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/git/refs`;

      const branchData = {
        ref: `refs/heads/${branchName}`,
        sha: sha,
      };

      const createBranchResponse = await axios.post(
        createBranchUrl,
        branchData,
        {
          headers: {
            Authorization: `Bearer ${decryptedOwnerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Branch created for ${user.name}:`, createBranchResponse.data);
    });

    // Wait for all branch creation promises to finish
    await Promise.all(createBranchesPromises);
    console.log("All branches created.");
    usersWithDetails.push(req.user);
    // Step 8: Create the group chat in the database
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: usersWithDetails,
      isGroupChat: true,
      groupAdmin: req.user,
      repositoryName: repoName,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);

  } catch (error) {
    console.error("Error during group chat creation:", error);
    if (!res.headersSent) {
      res.status(400).send({ error: error.message });
    }
  }
});







const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
}
 else {
    res.json(updatedChat);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // Find the chat by ID
  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404).send({ message: "Chat Not Found" });
    throw new Error("Chat Not Found");
  }

  // Get the current GitHub token of the group admin
  const decryptedAdminToken = decryptToken(added.groupAdmin.githubToken); // Decrypt the admin's GitHub token

  // Find the new user added to the group
  const newUser = added.users.find((user) => user._id.toString() === userId);
  if (!newUser) {
    return res.status(404).send({ message: "New user not found in the group" });
  }

  // Get the GitHub username of the new user (to add as a collaborator)
  try {
    const newUserGithubUsername = await getGitHubUsername(newUser.githubToken);
// console.log("new user:",newUserGithubUsername);
    // Add the new user as a collaborator to the GitHub repository
    const repoName = added.repositoryName;
    const githubUsername = await getGitHubUsername(added.groupAdmin.githubToken); // GitHub username of the admin
    // console.log("new user:",githubUsername);
    const addCollaboratorUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/collaborators/${newUserGithubUsername}`;

    await axios.put(
      addCollaboratorUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${decryptedAdminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Collaborator added successfully:', newUserGithubUsername);
  } catch (error) {
    console.error("Error adding collaborator to GitHub:", error.message);
    return res.status(500).send({ message: "Failed to add collaborator to GitHub" });
  }

  res.json(added); // Send the updated chat object
});
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // Step 1: Find the chat by ID
  const chat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!chat) {
    return res.status(404).send({ message: "Chat Not Found" });
  }

  // Step 2: Find the user to be removed from the chat
  const userToRemove = chat.users.find((user) => user._id.toString() === userId);

  if (!userToRemove) {
    return res.status(404).send({ message: "User not found in this chat" });
  }

  // Step 3: Get the GitHub username of the user to be removed
  let removedUserGithubUsername;
  try {
    removedUserGithubUsername = await getGitHubUsername(userToRemove.githubToken);
  } catch (error) {
    return res.status(500).send({ message: "Failed to fetch GitHub username" });
  }

  // Step 4: Remove the user from the chat group (this is now safe)
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  // Step 5: Decrypt the admin's GitHub token and remove the user as a collaborator
  const decryptedAdminToken = decryptToken(updatedChat.groupAdmin.githubToken);

  const repoName = updatedChat.repositoryName;
  const githubUsername = await getGitHubUsername(updatedChat.groupAdmin.githubToken); // GitHub username of the admin

  try {
    const removeCollaboratorUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/collaborators/${removedUserGithubUsername}`;
    
    await axios.delete(removeCollaboratorUrl, {
      headers: {
        Authorization: `Bearer ${decryptedAdminToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Collaborator removed successfully:', removedUserGithubUsername);
  } catch (error) {
    console.error("Error removing collaborator from GitHub:", error.message);
    return res.status(500).send({ message: "Failed to remove collaborator from GitHub" });
  }

  // Step 6: Return the updated chat object
  res.json(updatedChat);
});



const getGroupAdminUsername = async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({ error: "Chat ID is required" });
  }

  try {
    const chat = await Chat.findById(chatId).populate("groupAdmin"); // Replace with your model logic
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const adminUsername = chat.admin.username; // Adjust based on your schema
    res.status(200).json({ adminUsername });
  } catch (error) {
    console.error("Error fetching admin GitHub username:", error);
    res.status(500).json({ error: "Failed to fetch admin username" });
  }
};

module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, getGroupAdminUsername };
