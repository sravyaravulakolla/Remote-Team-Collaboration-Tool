const axios = require('axios');

// Replace these with your actual values
const GITHUB_TOKEN = 'token';  // GitHub personal access token with repo scope
const REPO_OWNER = 'MandadiVaishnavi';  // Your GitHub username or organization name
const REPO_NAME = 'new-repo-111';  // The repository name
const COLLABORATOR_USERNAME = 'vaishnavi-53';  // The username of the collaborator you want to add
const NEW_BRANCH_NAME = 'new-branch-name1';  // The name of the branch you want to create

// Step 1: Create a GitHub repository with the default branch as 'main'
const createRepo = async () => {
  try {
    const repoDetails = {
      name: REPO_NAME,
      description: 'This is a test repo created via GitHub API',  // Optional description
      private: false,  // Set to true for private repo, false for public
      default_branch: 'main',  // Ensure the default branch is 'main'
    };

    const response = await axios.post('https://api.github.com/user/repos', repoDetails, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Repository Created Successfully:');
    console.log(`Name: ${response.data.name}`);
    console.log(`URL: ${response.data.html_url}`);

    // After creating the repo, let's add the collaborator, and create an initial commit
    await addCollaborator(); // Add the collaborator
    await createInitialCommit();  // Create an initial commit in the repo
    await createBranch();  // Create the new branch
  } catch (error) {
    console.error('Error creating repo:', error.response ? error.response.data : error.message);
  }
};

// Step 2: Add a collaborator to the GitHub repository
const addCollaborator = async () => {
  try {
    const response = await axios.put(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/collaborators/${COLLABORATOR_USERNAME}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Collaborator ${COLLABORATOR_USERNAME} added successfully.`);
  } catch (error) {
    console.error('Error adding collaborator:', error.response ? error.response.data : error.message);
  }
};

// Step 3: Create an initial commit (e.g., add a README.md file)
const createInitialCommit = async () => {
  try {
    // Step 1: Create a new file in the repository (e.g., a README.md)
    const newFile = {
      message: 'Initial commit',  // Commit message
      content: Buffer.from('# New Repo\nThis is a new repository').toString('base64'),  // Base64-encoded content of README.md
    };

    const response = await axios.put(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/README.md`,
      newFile,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Initial commit created successfully:', response.data.commit.sha);
  } catch (error) {
    console.error('Error creating initial commit:', error.response ? error.response.data : error.message);
  }
};

// Step 4: Create a new branch from the 'main' branch
const createBranch = async () => {
  try {
    // Step 1: Get the SHA of the latest commit on the 'main' branch
    const branchResponse = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const sha = branchResponse.data.object.sha;
    console.log(`SHA of 'main' branch: ${sha}`);

    // Step 2: Create a new branch with the name
    const createBranchResponse = await axios.post(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
      {
        ref: `refs/heads/${NEW_BRANCH_NAME}`,
        sha: sha,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Branch '${NEW_BRANCH_NAME}' created successfully.`);
  } catch (error) {
    console.error('Error creating branch:', error.response ? error.response.data : error.message);
  }
};

// Run the functions
createRepo();  // Create the repo, add a collaborator, create the initial commit, and create the branch


// // const axios = require('axios');

// // const githubToken = '';  // Replace with your GitHub Token

// // // GitHub API URLs
// // const createRepoApiUrl = 'https://api.github.com/user/repos';

// // // Repo details
// // const repoDetails = {
// //   name: 'new-repo-name2', // Replace with your desired repo name
// //   description: 'This is a test repo created via GitHub API', // Optional description
// //   private: false, // Set to true for private repo, false for public
// // };

// // // Collaborator details
// // const collaboratorUsername = 'vaishnavi-53'; // Replace with the GitHub username of the collaborator

// // // Step 1: Create a GitHub repository
// // const createRepo = async () => {
// //   try {
// //     const response = await axios.post(createRepoApiUrl, repoDetails, {
// //       headers: {
// //         'Authorization': `Bearer ${githubToken}`,
// //         'Content-Type': 'application/json',
// //       },
// //     });

// //     console.log('Repository Created Successfully:');
// //     console.log(`Name: ${response.data.name}`);
// //     console.log(`URL: ${response.data.html_url}`);

// //     // Step 2: Add a collaborator to the newly created repository
// //     const repoOwner = response.data.owner.login; // Get the repository owner's username
// //     const repoName = response.data.name; // Get the repository name
// //     await addCollaborator(repoOwner, repoName);
// //   } catch (error) {
// //     console.error('Error creating repo:', error.response ? error.response.data : error.message);
// //   }
// // };

// // // Step 2: Add a collaborator to the GitHub repository
// // const addCollaborator = async (repoOwner, repoName) => {
// //   try {
// //     const addCollaboratorApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${collaboratorUsername}`;
    
// //     const response = await axios.put(
// //       addCollaboratorApiUrl, 
// //       {},
// //       {
// //         headers: {
// //           'Authorization': `Bearer ${githubToken}`,
// //           'Content-Type': 'application/json',
// //         },
// //       }
// //     );

// //     console.log(`Successfully added ${collaboratorUsername} as a collaborator to ${repoName}!`);
// //   } catch (error) {
// //     console.error('Error adding collaborator:', error.response ? error.response.data : error.message);
// //   }
// // };

// // // Execute the function to create a repo and add a collaborator
// // createRepo();



// const axios = require('axios');

// const fetchBranches = async () => {
//   try {
//     const response = await axios.get('https://api.github.com/repos/MandadiVaishnavi/gr25/branches');
//     console.log(response.data); // List of branches
//   } catch (error) {
//     console.error('Error fetching branches:', error.message);
//   }
// };

// fetchBranches();
