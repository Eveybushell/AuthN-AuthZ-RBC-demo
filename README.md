# AuthN-AuthZ-RBC-demo

## Set Up
- 'npm install' for packages
- create a .env file with JWT_SECRET password
- 'node server.js' to start local /3000 site

## Prompts:

PROMPT: Act as a senior security engineer. Build a lightweight full-stack application (or REST API with a simple frontend) demonstrating basic Authentication and Role-Based Access Control (RBAC).
 
The application must include:
1. User Registration & Login with two roles: 'User' and 'Admin'.
2. Password hashing using a modern, secure algorithm.
3. Token-based (JWT) or Session-based authentication.
4. Three distinct views or API endpoints:
   - Public: Accessible to anyone (e.g., home/landing page).
   - Protected (User): Accessible to any authenticated user (e.g., user profile or dashboard).
   - Restricted (Admin Only): Accessible ONLY to users with the 'Admin' role (e.g., user management list or system metrics).
 
Provide the backend server code, route-guard middleware, and a minimal frontend or HTML/JS interface to test registration, login, logout, and role access.

REPLY: I was given a basic structure of code for the demonstration.

PROMPT: Why is path included if it is not used?

REPLY: Good catch. The `path` module was imported out of habit but is genuinely unused in this script. You can safely delete `const path = require('path');`.

In a standard Node.js/Express application, the built-in `path` module is critical for safely resolving directory structures across different operating systems when serving frontend assets or static files (e.g., `res.sendFile(path.join(__dirname, 'public', 'index.html'))`).

However, to keep this demonstration completely self-contained and easy to run, I embedded the HTML directly into a JavaScript string variable (`htmlFrontend`) and served it via `res.send()`. Because no external files or directories are being read from the file system, the `path` module is never called.

## Security Errors found:

1. The JWT_SECRET was originally hardcoded into the server.js file and would have been included in the repo. I have moved it into a .env file.
2. There was no requirements on either username or password. This could have allowed unnecessarily long passwords to be hashed which could have been exploited to slow our system. It also allowed for insecure passwords and possible SQL injection.
3. There was no limit on JSON payload sizes, so malicious actors could have sent large JSON files and caused a DOS for all other users.
