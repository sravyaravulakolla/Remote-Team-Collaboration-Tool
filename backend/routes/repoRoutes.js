// routes/repoRoutes.js
const express = require('express');
const { getRepositoryDetails, fetchRepositoryBranches,fetchFileContent, fetchFileTree,fetchCommits,uploadFile ,fetchFolders} = require('../controllers/repoController');
const router = express.Router();
const multer = require('multer'); // Import multer for file handling

// Set up multer for file handling (in-memory storage for simplicity)
const upload = multer(); // You can customize the storage options if necessary

// Route to fetch repository details (repository name and owner)
router.get('/:chatId/repodetails', getRepositoryDetails);

// Route to fetch branches of the repository
router.get('/:chatId/branches', fetchRepositoryBranches);


// New route to fetch the directory tree
router.get('/:userId/tree', fetchFileTree);

// New route to fetch file content
router.get('/:userId/file', fetchFileContent);


// New route to fetch commits for a specific repository and branch
router.get('/:userId/commits', fetchCommits);

// **Updated** route for file upload (POST method)
router.post('/:userId/upload', upload.single('file'), uploadFile); // Use 'POST' for file upload

router.get('/:userId/folders', fetchFolders);
module.exports = router;
