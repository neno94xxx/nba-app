const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'home', 'index.html'));
});

router.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'game', 'index.html'));
});

router.get('/team', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'team', 'index.html'));
});

router.get('/players-by-season', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'players-by-season', 'index.html'));
});

router.get('/player-history', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', '..', 'public', 'player-history', 'index.html')
  );
});

router.get('/playbyplay', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', '..', 'public', 'playbyplay', 'index.html')
  );
});

module.exports = router;