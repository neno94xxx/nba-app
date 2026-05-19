const seasonSelect = document.getElementById('seasonSelect');
const gameTypeSelect = document.getElementById('gameTypeSelect');
const loadGamesButton = document.getElementById('loadGamesButton');
const importNext20Button = document.getElementById('importNext20Button');
const statusMessage = document.getElementById('statusMessage');
const gamesTableBody = document.getElementById('gamesTableBody');

let gamesData = [];
let importedGameIds = new Set();

function formatDate(date) {
  if (!date) return '';
  return String(date).split('T')[0];
}

function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function getSeasonDateRange(season) {
  const startYear = Number(season.split('-')[0]);

  if (!startYear) {
    return null;
  }

  return {
    from: `${startYear}-10-01`,
    to: `${startYear + 1}-09-30`
  };
}

function buildScore(game) {
  const teamAPoints = game.team_a_points;
  const teamBPoints = game.team_b_points;

  if (teamAPoints === null || teamAPoints === undefined) return '';
  if (teamBPoints === null || teamBPoints === undefined) return '';

  return `${teamAPoints} - ${teamBPoints}`;
}

function getResultSet(data, name) {
  return data.resultSets?.find((resultSet) => resultSet.name === name);
}

function rowToObject(headers, row) {
  const obj = {};

  headers.forEach((header, index) => {
    obj[header] = row[index];
  });

  return obj;
}

function mapPlayerStatToDbRow(playerStat) {
  return {
    game_id: playerStat.GAME_ID,

    team_id: playerStat.TEAM_ID,
    player_id: playerStat.PLAYER_ID,

    start_position: playerStat.START_POSITION || null,

    min: playerStat.MIN || null,

    fgm: playerStat.FGM ?? null,
    fga: playerStat.FGA ?? null,
    fg_pct: playerStat.FG_PCT ?? null,

    fg3m: playerStat.FG3M ?? null,
    fg3a: playerStat.FG3A ?? null,
    fg3_pct: playerStat.FG3_PCT ?? null,

    ftm: playerStat.FTM ?? null,
    fta: playerStat.FTA ?? null,
    ft_pct: playerStat.FT_PCT ?? null,

    oreb: playerStat.OREB ?? null,
    dreb: playerStat.DREB ?? null,
    reb: playerStat.REB ?? null,

    ast: playerStat.AST ?? null,
    stl: playerStat.STL ?? null,
    blk: playerStat.BLK ?? null,

    turnovers: playerStat.TO ?? null,
    pf: playerStat.PF ?? null,
    pts: playerStat.PTS ?? null,

    plus_minus: playerStat.PLUS_MINUS ?? null
  };
}

function buildPlayerGameStatsRows(boxScoreData) {
  const playerStatsResultSet = getResultSet(
    boxScoreData,
    'PlayerStats'
  );

  if (!playerStatsResultSet) {
    return [];
  }

  return playerStatsResultSet.rowSet
    .map((row) => rowToObject(playerStatsResultSet.headers, row))
    .map(mapPlayerStatToDbRow);
}

async function loadImportedGameIds() {
  const response = await fetch('/api/player-game-stats/imported-game-ids');
  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    throw new Error(data.error || 'Greška kod dohvaćanja importiranih game_id vrijednosti.');
  }

  importedGameIds = new Set(
    data.gameIds.map((gameId) => normalize(gameId))
  );
}

function renderGames() {
  if (!gamesData.length) {
    gamesTableBody.innerHTML = `
      <tr>
        <td colspan="8">Nema utakmica za odabrane filtere.</td>
      </tr>
    `;

    importNext20Button.disabled = true;
    return;
  }

  gamesTableBody.innerHTML = gamesData.map((game, index) => {
    const isImported = importedGameIds.has(normalize(game.game_id));

    return `
      <tr class="${isImported ? 'imported-row' : ''}">
        <td class="${isImported ? 'imported-cell' : ''}">${game.game_id}</td>
        <td>${game.game_type ?? ''}</td>
        <td>${formatDate(game.game_date)}</td>
        <td>${game.matchup ?? ''}</td>
        <td>${game.team_a_abbreviation ?? ''}</td>
        <td>${game.team_b_abbreviation ?? ''}</td>
        <td>${buildScore(game)}</td>
        <td>
          <button
            class="import-game-stats-button"
            data-index="${index}"
            type="button"
            ${isImported ? 'disabled' : ''}
          >
            ${isImported ? 'Imported' : 'Import Data'}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  attachImportEvents();
  updateImportNext20Button();
}

function updateImportNext20Button() {
  const missingGames = getMissingGames();

  importNext20Button.disabled = missingGames.length === 0;
}

function getMissingGames() {
  return gamesData.filter(
    (game) => !importedGameIds.has(normalize(game.game_id))
  );
}

function attachImportEvents() {
  document.querySelectorAll('.import-game-stats-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = Number(button.dataset.index);
      const game = gamesData[index];

      if (!game) {
        statusMessage.textContent = 'Utakmica nije pronađena.';
        return;
      }

      const success = await importPlayerGameStats(game);

      if (success) {
        importedGameIds.add(normalize(game.game_id));
        renderGames();
      }
    });
  });
}

async function loadPlayerGameStats(game) {
  const response = await fetch(
    `/api/player-game-stats/boxscore?gameId=${game.game_id}`
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    throw new Error(
      data.error || `Greška kod dohvaćanja player stats za game ${game.game_id}.`
    );
  }

  console.log('PLAYER GAME STATS RESPONSE:', data);

  return data;
}

async function importPlayerGameStats(game) {
  try {
    statusMessage.textContent =
      `Loading player game stats for ${game.game_id}...`;

    const boxScoreData = await loadPlayerGameStats(game);

    const rows = buildPlayerGameStatsRows(boxScoreData);

    if (!rows.length) {
      statusMessage.textContent =
        `Nema PlayerStats redaka za game ${game.game_id}.`;
      return false;
    }

    console.log('PLAYER GAME STATS ROWS FOR IMPORT:', rows);

    statusMessage.textContent =
      `Importing ${rows.length} player stat rows for game ${game.game_id}...`;

    const response = await fetch('/api/player-game-stats/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rows })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod importa player stats za game ${game.game_id}: ${data.error}`;
      return false;
    }

    console.log('PLAYER GAME STATS IMPORT:', data);

    statusMessage.textContent =
      `Imported ${data.inserted} player stat rows for game ${game.game_id}.`;

    return true;
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      `Dogodila se greška kod importa player stats za game ${game.game_id}.`;

    return false;
  }
}

async function importNext20MissingGames() {
  const missingGames = getMissingGames().slice(0, 20);

  if (!missingGames.length) {
    statusMessage.textContent = 'Nema utakmica za import.';
    return;
  }

  importNext20Button.disabled = true;
  loadGamesButton.disabled = true;

  let importedCount = 0;

  for (let i = 0; i < missingGames.length; i++) {
    const game = missingGames[i];

    statusMessage.textContent =
      `Importing ${i + 1} / ${missingGames.length}: ${game.game_id}`;

    const success = await importPlayerGameStats(game);

    if (success) {
      importedCount += 1;
      importedGameIds.add(normalize(game.game_id));
      renderGames();
    }
  }

  loadGamesButton.disabled = false;
  updateImportNext20Button();

  statusMessage.textContent =
    `Finished. Imported ${importedCount} / ${missingGames.length} games.`;
}

async function loadGames() {
  const season = seasonSelect.value;
  const gameType = gameTypeSelect.value;
  const seasonRange = getSeasonDateRange(season);

  if (!seasonRange) {
    statusMessage.textContent = 'Neispravna sezona.';
    return;
  }

  const params = new URLSearchParams({
    gameType,
    dateFrom: seasonRange.from,
    dateTo: seasonRange.to
  });

  statusMessage.textContent = 'Loading imported game IDs...';

  try {
    await loadImportedGameIds();

    statusMessage.textContent = 'Loading games...';

    const response = await fetch(`/api/games/db/search?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja utakmica.';
      return;
    }

    gamesData = data;

    renderGames();

    statusMessage.textContent =
      `Loaded ${gamesData.length} games. Imported already: ${importedGameIds.size}.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Dogodila se greška kod dohvaćanja utakmica.';
  }
}

loadGamesButton.addEventListener('click', loadGames);
importNext20Button.addEventListener('click', importNext20MissingGames);