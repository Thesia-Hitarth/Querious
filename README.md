
<h1 align="center"> Querious 🚀</h1> 
<p align="center">
  <a href="https://github.com/Thesia-Hitarth/Querious">
    <img alt="Querious logo" title="Querious" src="./client/src/assets/Only-Symbol.png" width="150">
  </a>
</p>

<p align="center">
Welcome to **Querious**, a high-fidelity community-driven platform dedicated to fostering a vibrant ecosystem of developers helping developers by providing a space to ask questions, share knowledge, and find solutions together. 🌟❤
</p>

<p align="center">
  <a href="https://github.com/Thesia-Hitarth/Querious">Querious Codebase
  </a>
</p>


## Table of Contents

- [Important Links](#important-links-related-to-the-project)
- [Technology Used](#technology-used)
- [Features](#features)
- [Workspace Directory Structure](#workspace-directory-structure)
- [Installation & Local Setup](#installation--local-setup)
- [Deployment Configuration](#deployment-configuration)
- [Contributions](#contributions)
- [Feedback](#feedback)


### Important links related to the project

* <b>Code Repository 👉: </b> [Querious GitHub](https://github.com/Thesia-Hitarth/Querious)

* <b>Unified Vercel Deployment 👉: </b> Deployed as a single unified application (Frontend & Serverless Backend) directly on Vercel. Connect your imported GitHub project to Vercel and it compiles dynamically.


## Technology Used

| Technology | Features |
|------------|----------|
| **React.js** | Frontend interface with high-fidelity Stack Overflow UI redesign |    
| **Redux** | Global state management for questions, answers, and users |    
| **Node.js, Express.js** | Server-side API & endpoints for serverless execution |   
| **MongoDB Atlas, Mongoose** | Cloud database persistence layer |
| **Bcrypt** | Secure password hashing & cryptography |
| **JSON Web Token** | Authentication & authorization protocol |
| **Vercel** | Unified deployment hosting frontend assets and serverless functions |  
| **Socket.io** | Background real-time notification gateway (degrades gracefully under serverless) |


## Features

Features of Querious include:

* **Ask & Answer:** Post detailed code queries with an embedded markdown ReactQuill editor and answer community questions.
* **Similar Questions Autocomplete:** Real-time suggestion panel dynamically lists similar existing questions as you type the title.
* **Reputation Badges:** Automatically awards Gold, Silver, and Bronze badges on user profiles and cards depending on reputation points.
* **Voting & Accept:** Upvote or downvote questions and answers. Authors can accept answers to highlight the best solution.
* **Tags & Search:** Advanced search system supporting tag parsers (e.g., matching `[tag]`) and keywords.
* **Interactive Collectives:** Join and leave specialized topic hubs (MERN Stack, NLP, PHP, R) directly in the right sidebar.
* **On-Site Blogs:** Embedded blogs list linking to detailed MERN Stack articles at `/Blogs`.
* **Clean Theme Aesthetics:** Clean light theme colors (white `#ffffff`, orange brand colors `#f48225`, links blue `#0074cc`, and gray borders `#d6d9dc`).


## Workspace Directory Structure

The project is configured as a Node.js monorepo utilizing npm workspaces:

```text
├── client/                  # React Frontend application
│   ├── public/              # Public index HTML and assets
│   └── src/                 # React source code (components, Pages, redux)
├── server/                  # Node.js/Express Backend application
│   ├── controllers/         # Request handling logic
│   ├── models/              # MongoDB schemas
│   ├── routes/              # Express API endpoint definitions
│   └── index.js             # Express application definition
├── api/                     # Vercel Serverless Function entrypoint
│   └── index.js             # Gateway routing requests to Express app
├── vercel.json              # Unified Vercel route rewrites & build configs
├── package.json             # Workspace dependencies configuration
└── README.md
```


## Installation & Local Setup

The repository is built with npm workspaces, so you can set up both frontend and backend dependencies in a single step!

### 1. Clone the repository
```bash
git clone https://github.com/Thesia-Hitarth/Querious.git
cd Querious
```

### 2. Install dependencies
Run this single command at the root directory to install dependencies for both the `client` and `server`:
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file inside the `server/` directory:
```env
CONNECTION_URL = "your-mongodb-atlas-url"
JWT_SECRET = "your-custom-jwt-secret-string"
```

### 4. Run the application
Run the development command at the root directory to start both the Express backend and React frontend concurrently:
```bash
npm run dev
```

* React App: `http://localhost:3000`
* Express Server: `http://localhost:5000`


## Deployment Configuration

Querious is configured for unified deployment on Vercel:

1. **vercel.json**: Specifies route rewrites, routing `/user/*`, `/questions/*`, `/answer/*`, and `/notifications/*` to the serverless function gateway at `api/index.js`, while serving frontend assets statically from the built `client/build` folder.
2. **Serverless execution**: The entrypoint `api/index.js` imports and delegates to the main Express app, while `server/index.js` skips starting a persistent socket listener when `process.env.VERCEL` is active.


## Contributions

Your contributions are welcome! Feel free to open issues or submit pull requests for features and bug fixes.


## Feedback

Feel free to send feedback or file an issue in the GitHub repository issues list.
