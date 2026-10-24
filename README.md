# AuthN-AuthZ-RBC-demo

## Set Up
If running locally:
- 'npm install' for packages
- create a .env file with JWT_SECRET password
- Follow commenting / uncommenting pattern just above MINIMAL FRONTEND section
- 'node server.js' to start local /3000 site

If running on live site:
- visit https://authn-authz-rbc-demo-4gazsq9ia-evey2.vercel.app/
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

## QA Checklist

[ ] 1. Authentication Functional Tests:
Successful registration with a new account. Passed
Successful login generating an active session or token. Passed
Failed login with an invalid password displays a generic error message. Passed
Logout successfully invalidates or removes the local credential/session. Passed
[ ] 2. Authorization & Privilege Boundary Tests:
Logging in as a standard User allows access to the User Dashboard. Passed
Logging in as a standard User and attempting to access the Admin view/endpoint returns a clean 403 Forbidden (or redirects safely). Passed
Logging in as an Admin grants access to both User and Admin resources. Passed
Attempting to access protected endpoints while logged out returns 401 Unauthorized. Passed
[ ] 3. Input Validation & Edge Cases:
Empty username/password submissions are rejected with client and server validation. Passed
Entering special characters or SQL-like syntax does not crash the server. Passed
[ ] 4. Browser Console & Network Health:
Browser DevTools Network tab shows proper HTTP status codes (200, 401, 403). Passed
DevTools Console is free of unhandled JavaScript runtime exceptions. Passed
