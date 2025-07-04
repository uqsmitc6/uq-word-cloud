const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory storage with sessions
const sessions = new Map();

// Australian fauna and colors for room codes
const colors = ['PURPLE', 'GOLD', 'RED', 'BLUE', 'GREEN', 'ORANGE', 'PINK', 'TEAL'];
const animals = ['KOALA', 'KANGAROO', 'ECHIDNA', 'WOMBAT', 'PLATYPUS', 'DINGO', 'QUOKKA', 'WALLABY', 'KOOKABURRA', 'CASSOWARY', 'BILBY', 'NUMBAT'];

// Generate unique room code
function generateRoomCode() {
    let code;
    do {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        code = `${color}-${animal}`;
    } while (sessions.has(code));
    return code;
}

// Helper to get or create session
function getSession(sessionCode) {
    return sessions.get(sessionCode);
}

// Clean up old sessions (older than 24 hours)
setInterval(() => {
    const now = new Date();
    for (const [code, session] of sessions.entries()) {
        const age = now - session.createdAt;
        if (age > 24 * 60 * 60 * 1000) { // 24 hours
            sessions.delete(code);
        }
    }
}, 60 * 60 * 1000); // Check every hour

// Routes for different pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/teacher/:code', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/submit/:code', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to create a new session
app.post('/api/create-session', (req, res) => {
    const code = generateRoomCode();
    
    sessions.set(code, {
        responses: [],
        createdAt: new Date(),
        code: code
    });
    
    res.json({ code });
});

// API endpoint to check if session exists
app.get('/api/session/:code', (req, res) => {
    const sessionCode = req.params.code.toUpperCase();
    const session = sessions.get(sessionCode);
    
    if (!session) {
        return res.json({ exists: false });
    }
    
    res.json({
        exists: true,
        responseCount: session.responses.length,
        createdAt: session.createdAt
    });
});

// API endpoint to submit response
app.post('/api/submit', (req, res) => {
    const { nickname, response, sessionCode } = req.body;
    
    // Basic validation
    if (!response || response.trim().length === 0) {
        return res.status(400).json({ error: 'Response is required' });
    }
    
    if (!sessionCode) {
        return res.status(400).json({ error: 'Session code is required' });
    }
    
    const session = getSession(sessionCode.toUpperCase());
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check word count (1-3 words)
    const wordCount = response.trim().split(/\s+/).length;
    if (wordCount > 3) {
        return res.status(400).json({ error: 'Please enter only 1-3 words' });
    }
    
    // Add to session responses
    session.responses.push({
        nickname: nickname || 'Anonymous',
        response: response.trim(),
        timestamp: new Date()
    });
    
    res.json({ success: true });
});

// API endpoint to get all responses and stats for a session
app.get('/api/responses', (req, res) => {
    const sessionCode = req.query.session;
    
    if (!sessionCode) {
        return res.status(400).json({ error: 'Session code is required' });
    }
    
    const session = getSession(sessionCode.toUpperCase());
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const responses = session.responses;
    
    // Calculate statistics
    const uniqueStudents = new Set(responses.map(r => r.nickname)).size;
    
    // Get all words
    const allWords = responses.flatMap(r => r.response.toLowerCase().split(/\s+/));
    const uniqueWords = new Set(allWords).size;
    
    res.json({
        responses: responses,
        totalResponses: responses.length,
        uniqueWords: uniqueWords,
        activeStudents: uniqueStudents,
        sessionCode: sessionCode
    });
});

// API endpoint to clear all responses in a session
app.post('/api/clear', (req, res) => {
    const { sessionCode } = req.body;
    
    if (!sessionCode) {
        return res.status(400).json({ error: 'Session code is required' });
    }
    
    const session = getSession(sessionCode.toUpperCase());
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    session.responses = [];
    
    res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🎓 UQ Word Cloud Server Running!
    
    👩‍🏫 Teachers: Visit http://localhost:${PORT} to create sessions
    📱 Students: Visit http://localhost:${PORT}/join to join a session
    
    🚀 Ready for classroom use!
    `);
});