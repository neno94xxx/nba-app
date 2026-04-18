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

module.exports = router;