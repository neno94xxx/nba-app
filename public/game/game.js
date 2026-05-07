const loadGamesButton = document.getElementById('loadGamesButton');
const loadDbGamesButton = document.getElementById('loadDbGamesButton');
const importAllGamesButton = document.getElementById('importAllGamesButton');

const seasonSelect = document.getElementById('seasonSelect');
const seasonTypeSelect = document.getElementById('seasonTypeSelect');
const dateFromInput = document.getElementById('dateFromInput');
const dateToInput = document.getElementById('dateToInput');
const statusMessage = document.getElementById('statusMessage');

const apiGamesTableBody = document.getElementById('apiGamesTableBody');
const dbGamesTableBody = document.getElementById('dbGamesTableBody');

let apiGamesData = [];
let dbGamesData = [];

function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase();
}

function formatDate(date) {
  if (!date) return '';
  return String(date).split('T')[0];
}

function mapSeasonTypeToGameType(seasonType) {
  switch (seasonType) {
    case 'Regular Season':
      return 'REG';

    case 'Playoffs':
      return 'POF';

    case 'Pre Season':
      return 'PRE';

    case 'All Star':
      return 'ASG';

    default:
      return null;
  }
}

function getSelectedGameType() {
  return mapSeasonTypeToGameType(seasonTypeSelect.value);
}

function getFilteredDbGames() {
  const selectedGameType = getSelectedGameType();

  return dbGamesData.filter((game) => {
    if (!selectedGameType) return true;
    return normalize(game.game_type) === normalize(selectedGameType);
  });
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

function buildGamesFromLeagueGameFinder(data) {
  const resultSet = getResultSet(data, 'LeagueGameFinderResults');

  if (!resultSet || !Array.isArray(resultSet.rowSet)) {
    return [];
  }

  const rows = resultSet.rowSet.map((row) => rowToObject(resultSet.headers, row));
  const gamesMap = new Map();

  rows.forEach((row) => {
    const gameId = row.GAME_ID;

    if (!gamesMap.has(gameId)) {
      gamesMap.set(gameId, {
        gameId,
        gameDate: row.GAME_DATE,
        rows: []
      });
    }

    gamesMap.get(gameId).rows.push(row);
  });

  return Array.from(gamesMap.values()).map((game) => {
    const rows = game.rows;

    const first = rows[0];
    const second = rows[1];

    let teamA = first;
    let teamB = second;

    if (first?.MATCHUP?.includes(' vs. ')) {
      teamA = first;
      teamB = second;
    } else if (second?.MATCHUP?.includes(' vs. ')) {
      teamA = second;
      teamB = first;
    }

    const matchup = teamA?.MATCHUP || first?.MATCHUP || '';

    return {
      gameId: game.gameId,
      gameDate: formatDate(game.gameDate),
      matchup,

      gameType: getSelectedGameType(),

      teamAId: teamA?.TEAM_ID ?? null,
      teamAAbbreviation: teamA?.TEAM_ABBREVIATION ?? '',
      teamAName: teamA?.TEAM_NAME ?? '',
      teamAPoints: teamA?.PTS ?? null,

      teamBId: teamB?.TEAM_ID ?? null,
      teamBAbbreviation: teamB?.TEAM_ABBREVIATION ?? '',
      teamBName: teamB?.TEAM_NAME ?? '',
      teamBPoints: teamB?.PTS ?? null,

      rawRows: rows
    };
  });
}

function renderApiGames() {
  if (!apiGamesData.length) {
    apiGamesTableBody.innerHTML = `
      <tr>
        <td colspan="9">Nema utakmica.</td>
      </tr>
    `;
    return;
  }

  const importedGameIds = new Set(
    dbGamesData
      .filter((game) => normalize(game.game_type) === normalize(getSelectedGameType()))
      .map((game) => normalize(game.game_id))
  );

  apiGamesTableBody.innerHTML = apiGamesData.map((game, index) => {
    const imported = importedGameIds.has(normalize(game.gameId));

    return `
      <tr data-api-index="${index}">
        <td class="${imported ? 'imported-cell' : 'mismatch-cell'}">${game.gameId}</td>
        <td>${game.gameType ?? ''}</td>
        <td>${game.gameDate}</td>
        <td>${game.matchup}</td>
        <td>${game.teamAAbbreviation}</td>
        <td>${game.teamBAbbreviation}</td>
        <td>${game.teamAPoints ?? ''}</td>
        <td>${game.teamBPoints ?? ''}</td>
        <td>
          <button
            class="import-game-button"
            data-game-id="${game.gameId}"
            ${imported ? 'disabled' : ''}
          >
            ${imported ? 'Imported' : 'Import'}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  attachImportEvents();
}

function renderDbGames() {
  const filteredDbGames = getFilteredDbGames();

  if (!filteredDbGames.length) {
    dbGamesTableBody.innerHTML = `
      <tr>
        <td colspan="10">Nema spremljenih utakmica za odabrani tip.</td>
      </tr>
    `;
    return;
  }

  dbGamesTableBody.innerHTML = filteredDbGames.map((game) => `
    <tr>
      <td>${game.id}</td>
      <td>${game.game_id}</td>
      <td>${game.game_type ?? ''}</td>
      <td>${formatDate(game.game_date)}</td>
      <td>${game.matchup ?? ''}</td>
      <td>${game.team_a_abbreviation ?? ''}</td>
      <td>${game.team_b_abbreviation ?? ''}</td>
      <td>${game.team_a_points ?? ''}</td>
      <td>${game.team_b_points ?? ''}</td>
      <td>
        <button class="delete-game-button" data-id="${game.id}">
          Delete
        </button>
      </td>
    </tr>
  `).join('');

  attachDeleteEvents();
}

function buildGamePayload(game) {
  return {
    game_id: game.gameId,
    game_type: game.gameType,
    game_date: game.gameDate || null,
    matchup: game.matchup,

    team_a_id: game.teamAId,
    team_a_abbreviation: game.teamAAbbreviation,
    team_a_name: game.teamAName,
    team_a_points: game.teamAPoints,

    team_b_id: game.teamBId,
    team_b_abbreviation: game.teamBAbbreviation,
    team_b_name: game.teamBName,
    team_b_points: game.teamBPoints
  };
}

function attachImportEvents() {
  document.querySelectorAll('.import-game-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const gameId = button.dataset.gameId;
      const game = apiGamesData.find((item) => String(item.gameId) === String(gameId));

      if (!game) {
        statusMessage.textContent = `Game ${gameId} nije pronađen u API listi.`;
        return;
      }

      await importGame(game);
    });
  });
}

function attachDeleteEvents() {
  document.querySelectorAll('.delete-game-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      await deleteGame(id);
    });
  });
}

async function loadDbGames() {
  try {
    const response = await fetch('/api/games/db');
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja DB utakmica.';
      return;
    }

    dbGamesData = data;

    renderDbGames();
    renderApiGames();
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Dogodila se greška kod DB utakmica.';
  }
}

async function importGame(game) {
  try {
    statusMessage.textContent = `Importing game ${game.gameId}...`;

    const response = await fetch('/api/games/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildGamePayload(game))
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = `Greška kod importa game ${game.gameId}.`;
      return;
    }

    statusMessage.textContent = `Imported game ${game.gameId}.`;

    await loadDbGames();
  } catch (error) {
    console.error(error);
    statusMessage.textContent = `Dogodila se greška kod importa game ${game.gameId}.`;
  }
}

async function importAllMissingGames() {
  if (!apiGamesData.length) {
    statusMessage.textContent = 'Nema API utakmica.';
    return;
  }

  const selectedGameType = getSelectedGameType();

  const importedGameIds = new Set(
    dbGamesData
      .filter((game) => normalize(game.game_type) === normalize(selectedGameType))
      .map((game) => normalize(game.game_id))
  );

  const missingGames = apiGamesData.filter(
    (game) => !importedGameIds.has(normalize(game.gameId))
  );

  if (!missingGames.length) {
    statusMessage.textContent = 'Sve utakmice su već importirane.';
    return;
  }

  statusMessage.textContent = `Importing ${missingGames.length} missing games...`;

  let importedCount = 0;

  for (const game of missingGames) {
    try {
      const response = await fetch('/api/games/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildGamePayload(game))
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Import failed:', game.gameId, data);
        continue;
      }

      importedCount += 1;

      statusMessage.textContent =
        `Imported ${importedCount} / ${missingGames.length}`;
    } catch (error) {
      console.error('Import error:', game.gameId, error);
    }
  }

  statusMessage.textContent = `Finished importing ${importedCount} games.`;

  await loadDbGames();
}

async function deleteGame(id) {
  try {
    statusMessage.textContent = `Deleting game ID ${id}...`;

    const response = await fetch(`/api/games/db/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = `Greška kod brisanja game ID ${id}.`;
      return;
    }

    statusMessage.textContent = `Deleted game ID ${id}.`;

    await loadDbGames();
  } catch (error) {
    console.error(error);
    statusMessage.textContent = `Dogodila se greška kod brisanja game ID ${id}.`;
  }
}

async function loadApiGames() {
  const season = seasonSelect.value;
  const seasonType = seasonTypeSelect.value;
  const dateFrom = dateFromInput.value;
  const dateTo = dateToInput.value;

  const params = new URLSearchParams({
    season,
    seasonType
  });

  if (dateFrom) {
    params.append('dateFrom', dateFrom);
  }

  if (dateTo) {
    params.append('dateTo', dateTo);
  }

  statusMessage.textContent = 'Loading API games...';

  try {
    const response = await fetch(`/api/games/league-game-finder?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja API utakmica.';
      return;
    }

    console.log('LeagueGameFinder response:', data);

    apiGamesData = buildGamesFromLeagueGameFinder(data);

    apiGamesData.sort((a, b) => {
      if (a.gameDate < b.gameDate) return -1;
      if (a.gameDate > b.gameDate) return 1;
      return String(a.gameId).localeCompare(String(b.gameId));
    });

    renderApiGames();
    renderDbGames();

    statusMessage.textContent = `Loaded ${apiGamesData.length} API games.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Dogodila se greška kod API utakmica.';
  }
}

function handleSeasonTypeChange() {
  renderDbGames();
  renderApiGames();
}

loadGamesButton.addEventListener('click', loadApiGames);
loadDbGamesButton.addEventListener('click', loadDbGames);
importAllGamesButton.addEventListener('click', importAllMissingGames);
seasonTypeSelect.addEventListener('change', handleSeasonTypeChange);

loadDbGames();