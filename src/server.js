require('dotenv').config();

const express = require('express');
const path = require('path');
const gamesRoutes = require('./routes/games.routes');
const pagesRoutes = require('./routes/pages.routes');
const teamsRoutes = require('./routes/teams.routes');
const playersRoutes = require('./routes/players.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/', pagesRoutes);
app.use('/', gamesRoutes);
app.use('/', teamsRoutes);
app.use('/', playersRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});