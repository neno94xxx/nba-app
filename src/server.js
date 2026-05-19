require('dotenv').config();

const express = require('express');
const path = require('path');
const gamesRoutes = require('./routes/games.routes');
const pagesRoutes = require('./routes/pages.routes');
const teamsRoutes = require('./routes/teams.routes');
const playersRoutes = require('./routes/players.routes');
const playByPlayRoutes = require('./routes/playByPlay.routes');
const playerGameStatsRoutes = require('./routes/playerGameStats.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/', pagesRoutes);
app.use('/', gamesRoutes);
app.use('/', teamsRoutes);
app.use('/', playersRoutes);
app.use('/', playByPlayRoutes);
app.use('/', playerGameStatsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});