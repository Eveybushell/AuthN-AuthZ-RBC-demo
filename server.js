const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json()); // Parse JSON payloads

// ==========================================
// CONFIGURATION & IN-MEMORY DB (For Demo Only)
// ==========================================
const PORT = 3000;
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in the environment.");
    process.exit(1);
}
const usersDB = []; // In-memory database. Use PostgreSQL/MongoDB in production.

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// 1. Authentication Middleware (Verify JWT)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Expecting format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ error: 'Access Denied: No Token Provided' });

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) return res.status(403).json({ error: 'Invalid or Expired Token' });
        
        req.user = decodedUser; // Attach the decoded payload (id, role) to request
        next();
    });
};

// 2. Role-Based Access Control (RBAC) Middleware
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ error: `Forbidden: Requires ${requiredRole} privileges` });
        }
        next();
    };
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/auth/register', async (req, res) => {
    const { username, password, role } = req.body;
    function validateCredentials(username, password) {
        return (
            typeof username === 'string' &&
            username.length >= 3 &&
            username.length <= 50 &&
            /^[a-zA-Z0-9_.-]+$/.test(username) &&
            typeof password === 'string' &&
            Buffer.byteLength(password, 'utf8') >= 12 &&
            Buffer.byteLength(password, 'utf8') <= 72
        );
    }

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (usersDB.find(u => u.username === username)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    // Force role to be 'User' or 'Admin' (Default to User)
    const assignedRole = role === 'Admin' ? 'Admin' : 'User';

    app.use(express.json({ limit: '10kb' }));

    if (!validateCredentials(username, password)) {
        return res.status(400).json({
            error: 'Invalid username or password format'
        });
    }

    try {
        // Hash password with a cost factor of 10
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = { 
            id: Date.now().toString(), 
            username, 
            password: hashedPassword, 
            role: assignedRole 
        };

        const sanitizeUser = (user) => {
            const { password, ...safeUser } = user;
            return safeUser;
        };
        
        usersDB.push(newUser);
        res.status(201).json({ message: `User registered successfully as ${assignedRole}` });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = usersDB.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' }); // Don't leak user existence
    }

    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT (Payload includes ID and Role)
    const token = jwt.sign(
        { id: user.id, role: user.role, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' } // Short expiration is best practice
    );

    res.json({ token, role: user.role, message: 'Login successful' });
});

// ==========================================
// APPLICATION ROUTES (Views / API Endpoints)
// ==========================================

// 1. Public Endpoint (No auth required)
app.get('/api/public', (req, res) => {
    res.json({ message: 'Welcome to the Public Landing Page. Anyone can see this.' });
});

// 2. Protected Endpoint (Requires valid JWT)
app.get('/api/user/dashboard', authenticateToken, (req, res) => {
    res.json({ message: `Hello ${req.user.username}, welcome to your protected dashboard! Your role is: ${req.user.role}.` });
});

// 3. Restricted Endpoint (Requires valid JWT AND 'Admin' role)
app.get('/api/admin/metrics', authenticateToken, requireRole('Admin'), (req, res) => {
    res.json({ 
        message: 'Admin Access Granted.', 
        metrics: { totalUsers: usersDB.length, activeSessions: 'Unknown' } 
    });
});

// Serve Frontend
app.get('/', (req, res) => {
    res.send(htmlFrontend);
});

// Uncomment for local view and comment out module.exports = app;

// app.listen(PORT, () => {
//     console.log(`Server running...`);
// });

module.exports = app;

// ==========================================
// MINIMAL FRONTEND (HTML/JS)
// ==========================================
const htmlFrontend = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RBAC Security Demo</title>
    <style>
        body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
        .box { border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; border-radius: 5px; }
        button { padding: 0.5rem 1rem; cursor: pointer; }
        input, select { padding: 0.5rem; margin: 0.2rem 0; width: 100%; box-sizing: border-box; }
        #output { background: #222; color: #0f0; padding: 1rem; font-family: monospace; white-space: pre-wrap; border-radius: 5px; }
    </style>
</head>
<body>
    <h2>RBAC Auth Demo</h2>
    
    <div class="box">
        <h3>1. Register</h3>
        <input type="text" id="reg-user" placeholder="Username">
        <input type="password" id="reg-pass" placeholder="Password">
        <select id="reg-role">
            <option value="User">User</option>
            <option value="Admin">Admin</option>
        </select>
        <button onclick="register()">Register</button>
    </div>

    <div class="box">
        <h3>2. Login</h3>
        <input type="text" id="log-user" placeholder="Username">
        <input type="password" id="log-pass" placeholder="Password">
        <button onclick="login()">Login</button>
        <button onclick="logout()">Logout</button>
    </div>

    <div class="box">
        <h3>3. Test Endpoints</h3>
        <button onclick="fetchAPI('/api/public')">Public Route</button>
        <button onclick="fetchAPI('/api/user/dashboard')">Protected Route (User+)</button>
        <button onclick="fetchAPI('/api/admin/metrics')">Restricted Route (Admin Only)</button>
    </div>

    <h3>Output / Server Response:</h3>
    <div id="output">Waiting for action...</div>

    <script>
        let currentToken = null;

        function logOutput(data) {
            document.getElementById('output').textContent = JSON.stringify(data, null, 2);
        }

        async function register() {
            const res = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('reg-user').value,
                    password: document.getElementById('reg-pass').value,
                    role: document.getElementById('reg-role').value
                })
            });
            logOutput(await res.json());
        }

        async function login() {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('log-user').value,
                    password: document.getElementById('log-pass').value
                })
            });
            const data = await res.json();
            if (data.token) {
                currentToken = data.token; // Store token in memory
                data.note = "Token saved in memory.";
            }
            logOutput(data);
        }

        function logout() {
            currentToken = null;
            logOutput({ message: "Logged out successfully. Token destroyed." });
        }

        async function fetchAPI(endpoint) {
            const headers = {};
            if (currentToken) {
                headers['Authorization'] = 'Bearer ' + currentToken;
            }
            const res = await fetch(endpoint, { headers });
            logOutput(await res.json());
        }
    </script>
</body>
</html>
`;