const axios = require('axios');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const https = require('https');

const multer = require('multer');
const upload = multer();  // Use multer for handling file uploads

// Function to get the GitHub username (owner) from the group admin's token
const getGitHubUsername = async (token) => {
  try {
    if (!token) throw new Error('GitHub token is missing');

    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.login;
  } catch (error) {
    console.error('Error fetching GitHub username:', error.message);
    throw new Error('Failed to fetch GitHub username');
  }
};

// Function to get the repository details (name and owner) from the chat object
const getRepositoryDetails = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId).populate('groupAdmin');
    if (!chat || !chat.groupAdmin || !chat.repositoryName) {
      return res.status(400).json({ error: 'Invalid or missing chat object' });
    }

    const groupAdmin = chat.groupAdmin;
    if (!groupAdmin.githubToken) {
      return res.status(400).json({ error: 'GitHub token is missing for the group admin' });
    }

    const repositoryName = chat.repositoryName;
    const ownerUsername = await getGitHubUsername(groupAdmin.githubToken);
    res.status(200).json({ repositoryName, owner: ownerUsername });
  } catch (error) {
    console.error('Error fetching repository details:', error);
    res.status(500).json({ error: 'Failed to fetch repository details' });
  }
};

// Function to fetch the branches of a repository
const fetchRepositoryBranches = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId).populate('groupAdmin');
    if (!chat || !chat.groupAdmin || !chat.repositoryName) {
      return res.status(400).json({ error: 'Chat object is required with valid groupAdmin and repositoryName' });
    }

    const { repositoryName, groupAdmin } = chat;
    const ownerUsername = await getGitHubUsername(groupAdmin.githubToken);

    const branchesUrl = `https://api.github.com/repos/${ownerUsername}/${repositoryName}/branches`;
    const response = await axios.get(branchesUrl, {
      headers: {
        Authorization: `Bearer ${groupAdmin.githubToken}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching branches:', error.message);
    if (error.response && error.response.status === 403) {
      return res.status(403).json({ error: 'GitHub API rate limit exceeded. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to fetch repository branches' });
  }
};




// Recursive helper function to fetch directory tree
const fetchTree = async (owner, repo, path = '', branch = 'main', token) => {
  try {
    // Build the URL for the GitHub API
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    console.log('GitHub API URL:', url); // Log the URL to debug

    // Make the request
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Disable SSL verification for local testing
      },
    });

    // Map over the response data
    const items = await Promise.all(
      response.data.map(async (item) => {
        if (item.name === 'node_modules') return null; // Skip node_modules folder

        if (item.type === 'dir') {
          // If it's a directory, recurse into it
          const children = await fetchTree(owner, repo, item.path, branch, token);
          return { name: item.name, path: item.path, type: item.type, children };
        } else {
          // Otherwise, return the file info
          return { name: item.name, path: item.path, type: item.type, download_url: item.download_url };
        }
      })
    );

    // Filter out null values
    return items.filter(Boolean);
  } 
  catch (error) {
    console.error('Error fetching file tree from GitHub:', error.message);

    // Check if the error is a 404
    if (error.response && error.response.status === 404) {
      console.error('Resource not found:', error.config.url); // Log the URL that caused the 404
      throw new Error(`Resource not found: ${error.config.url}`);
    }

    throw new Error('Error fetching file tree');
  }
};

// Fetch the file tree for a repository
const fetchFileTree = async (req, res) => {
  const userId = req.params.userId;
  console.log('userId', userId);
  const { owner, repo, branch, path = '' } = req.query;

  try {
    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Fetch user from the database using userId
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub token is missing for the user' });
    }
    console.log(user.githubToken);

    // Fetch the file tree using the GitHub token
    const treeData = await fetchTree(owner, repo, path, branch, user.githubToken);
    res.status(200).json(treeData);
  } catch (error) {
    console.error('Error fetching file tree:', error.message);
    res.status(500).json({ error: 'Error fetching file tree' });
  }
};

// Fetch file content
const fetchFileContent = async (req, res) => {
  const { owner, repo, branch, path } = req.query;
  const userId = req.params.userId;

  try {
    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Fetch user from the database using userId
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub token is missing for the user' });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${user.githubToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.content) {
      const content = response.data.content; // Decode base64 content
      res.status(200).json({ content });
    } else {
      res.status(404).json({ error: 'File content not found' });
    }
  } catch (error) {
    console.error('Error fetching file content:', error.message);
    res.status(500).json({ error: 'Error fetching file content' });
  }
};


// Route to fetch commits
async function fetchCommits(req, res) {
  const { owner, repositoryName, branch } = req.query;
  const userId = req.params.userId;

  try {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Fetch the user's GitHub token from the database
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub token is missing' });
    }

    // Construct the GitHub API URL
    const url = `https://api.github.com/repos/${owner}/${repositoryName}/commits`;

    // Fetch commit data from GitHub API
    const response = await axios.get(url, {
      params: { sha: branch },  // Fetch commits for the selected branch
      headers: {
        Authorization: `Bearer ${user.githubToken}`,  // Use the user's GitHub token
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);  // Return the commit data to the frontend
  } catch (error) {
    console.error('Error fetching commits:', error.response?.data?.message || error.message);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
}


// Function to upload file to GitHub
const uploadFileToGitHub = async ({ repo, branch, path, token, fileBuffer, commitMessage, owner }) => {
  // If path is empty, upload to the root directory
  // if (!path || path === '') {
  //   path = fileBuffer.originalname;  // Upload to the root with the file name
  // }
  console.log('path',path);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  console.log('Upload URL:', url);

  try {
    const response = await axios.put(url, {
      message: commitMessage, // Commit message for the upload
      content: fileBuffer.toString('base64'), // File content encoded in base64
      branch: branch, // Branch to commit the file to
    }, {
      headers: {
        Authorization: `token ${token}`, // GitHub token for authorization
        'Accept': 'application/vnd.github.v3+json', // Specify GitHub API version
      },
    });

    return response.data; // Return the response data from the GitHub API
  } catch (error) {
    console.error('Error uploading file to GitHub:', error.message);
    throw new Error(`GitHub upload failed: ${error.message}`);
  }
};



// Route to handle file upload (use 'upload.single('file')' to process the file)
async function uploadFile(req, res) {
  const { path: directoryPath, commitMessage, owner, repo, branch } = req.body;
  const userId = req.params.userId;

  // Handle file upload (multer will parse the file)
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!commitMessage) {
    return res.status(400).json({ error: 'Commit message is required.' });
  }

  // Ensure the directory path is provided or default to the root directory
  const filePath = directoryPath && directoryPath !== '' ? `${directoryPath}/${req.file.originalname}` : req.file.originalname; // Default to root if no directory
  console.log('Final upload path:', filePath);  // Log the final file path

  try {
    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Fetch user from the database using userId
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub token is missing for the user' });
    }

    // Call the function to upload the file to GitHub
    const result = await uploadFileToGitHub({
      repo,
      branch,
      path: filePath, // Path will be root if no directoryPath is provided
      token: user.githubToken, // Use the GitHub token from the user
      fileBuffer: req.file.buffer,  // req.file.buffer from multer
      commitMessage,
      owner,
    });

    // Return the result from GitHub API
    res.json(result);
  } catch (error) {
    console.error('Error uploading file:', error.message);
    // Send more detailed error response to client
    res.status(500).json({ error: 'Failed to upload the file to GitHub', details: error.message });
  }
}

// Recursive helper function to fetch directory tree
const fetchFolders = async (req, res) => {
  const userId = req.params.userId;
  const { owner, repo, branch, path = '' } = req.query;

  try {
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Fetch user from the database using userId
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub token is missing for the user' });
    }

    // GitHub API URL for fetching directory contents
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    console.log('GitHub API URL:', url); // Log the URL for debugging

    // Make the request to the GitHub API
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${user.githubToken}`,
        'Accept': 'application/vnd.github.v3+json', // GitHub API version
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Disable SSL for local testing
      },
    });

    // Filter out only directories (exclude files)
    const directories = response.data.filter(item => item.type === 'dir');

    // If directories are found, recursively fetch subdirectories
    const items = await Promise.all(
      directories.map(async (item) => {
        const children = await fetchFoldersRecursive(owner, repo, item.path, branch, user.githubToken);
        return {
          name: item.name,
          path: item.path,
          type: item.type,
          children: children.length > 0 ? children : [], // Include subdirectories if available
        };
      })
    );

    // Return the array of directory items (with subdirectories)
    return res.json(items);
  } catch (error) {
    console.error('Error fetching directory tree from GitHub:', error.message);

    // Handle errors appropriately, check for 404 for missing directories
    if (error.response && error.response.status === 404) {
      console.error('Resource not found:', error.config.url); // Log the URL that caused the 404
      return res.status(404).json({ error: `Resource not found: ${error.config.url}` });
    }

    return res.status(500).json({ error: 'Error fetching directory tree' });
  }
};

// Recursive function to fetch subdirectories
const fetchFoldersRecursive = async (owner, repo, path, branch, token) => {
  try {
    // GitHub API URL for fetching directory contents
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    console.log('GitHub API URL (recursive):', url);

    // Make the request to GitHub API
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Disable SSL for local testing
      },
    });

    // Filter out directories
    const directories = response.data.filter(item => item.type === 'dir');

    // If directories are found, recursively fetch subdirectories
    const items = await Promise.all(
      directories.map(async (item) => {
        const children = await fetchFoldersRecursive(owner, repo, item.path, branch, token);
        return {
          name: item.name,
          path: item.path,
          type: item.type,
          children: children.length > 0 ? children : [], // Include subdirectories if available
        };
      })
    );

    return items;
  } catch (error) {
    console.error('Error fetching directory tree from GitHub (recursive):', error.message);
    throw new Error('Error fetching directory tree recursively');
  }
};



module.exports = { getGitHubUsername, getRepositoryDetails, fetchRepositoryBranches, fetchFileTree, fetchFileContent ,fetchCommits,uploadFile,fetchFolders};
