const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const socketIo = require('socket.io');

const app = express();
const server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/your_domain.com/privkey.pem'), // Replace with your SSL certificate paths
    cert: fs.readFileSync('/etc/letsencrypt/live/your_domain.com/fullchain.pem'),
}, app);
const io = socketIo(server);

const PORT = process.env.PORT || 443; // Standard HTTPS port
const MONGO_URI = 'mongodb://localhost:27017/yourdb'; // Replace with your MongoDB URI

// Connect to MongoDB
async function connectToDatabase() {
    try {
        const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(); // Get the database instance
        console.log('Connected to MongoDB');
        return db;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
}

// Define a user schema and model
// ...

app.use(express.json());

// API endpoint for user registration
app.post('/register', async (req, res) => {
    try {
        const db = await connectToDatabase();

        // Create a new user
        const newUser = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        };

        // Insert the user into the "users" collection
        const result = await db.collection('users').insertOne(newUser);

        // Emit a registration event to connected clients
        io.emit('registration', newUser);

        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the HTTPS server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
