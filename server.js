const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Hardcoded admin password (not exposed client-side)
const admin_PASSWORD = '1g2u3u4s'; // Change this to a strong password

app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'vmlgames-secret', // Change this in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true with HTTPS in production
}));

const gamesFile = path.join(__dirname, 'games.json');
if (!fs.existsSync(gamesFile)) {
  fs.writeFileSync(gamesFile, JSON.stringify([]));
}

const suggestionsFile = path.join(__dirname, 'suggestions.json');
if (!fs.existsSync(suggestionsFile)) {
    fs.writeFileSync(suggestionsFile, JSON.stringify([]));
}

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).send('Unauthorized: Please log in');
  }
};

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/library', (req, res) => res.sendFile(path.join(__dirname, 'public', 'library.html')));
app.get('/suggestions', (req, res) => res.sendFile(path.join(__dirname, 'public', 'suggestions.html')));
app.get('/game/:title', (req, res) => res.sendFile(path.join(__dirname, 'public', 'game.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin-dashboard', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html')));

// API endpoints
app.get('/api/games', (req, res) => {
  const games = JSON.parse(fs.readFileSync(gamesFile));
  res.json(games);
});

app.get('/api/suggestions', (req, res) => {
  const suggestions = JSON.parse(fs.readFileSync(suggestionsFile));
  res.json(suggestions);
});

// admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === admin_PASSWORD) {
    req.session.isAuthenticated = true;
    res.json({ message: 'Login successful', redirect: '/admin-dashboard' });
  } else {
    
  }
});

app.post('/api/suggestions', (req, res) => {
  const newSuggestion = req.body;
  const suggestions = JSON.parse(fs.readFileSync(suggestionsFile));
  suggestions.push(newSuggestion);
  fs.writeFileSync(suggestionsFile, JSON.stringify(suggestions, null, 2));
  res.json({ message: 'Suggestion added successfully' });
});

// Secure POST endpoint for adding games
app.post('/api/games', isAuthenticated, (req, res) => {
  const newGame = req.body;
  const games = JSON.parse(fs.readFileSync(gamesFile));
  games.push(newGame);
  fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
});

// Secure PUT endpoint for updating games
app.put('/api/games/:title', isAuthenticated, (req, res) => {
  const title = decodeURIComponent(req.params.title);
  const updatedGame = req.body;
  const games = JSON.parse(fs.readFileSync(gamesFile));
  const index = games.findIndex(g => g.title === title);
  if (index !== -1) {
    games[index] = updatedGame;
    fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
  } else {
    res.status(404).json({ message: 'Game not found' });
  }
});

// Secure DELETE endpoint for removing games
app.delete('/api/games/:title', isAuthenticated, (req, res) => {
  const title = decodeURIComponent(req.params.title);
  const games = JSON.parse(fs.readFileSync(gamesFile));
  const updatedGames = games.filter(g => g.title !== title);
  if (games.length !== updatedGames.length) {
    fs.writeFileSync(gamesFile, JSON.stringify(updatedGames, null, 2));
  } else {
    res.status(404).json({ message: 'Game not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});