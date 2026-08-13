const seasonSelect = document.getElementById('seasonSelect');
const gameTypeSelect = document.getElementById('gameTypeSelect');
const loadGamesButton = document.getElementById('loadGamesButton');
const importNext20Button = document.getElementById('importNext20Button');
const statusMessage = document.getElementById('statusMessage');
const gamesTableBody = document.getElementById('gamesTableBody');

let gamesData = [];
let importedGameIds = new Set();
let isBatchImporting = false;
let isSingleImporting = false;

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
            ${isImported || isBatchImporting || isSingleImporting ? 'disabled' : ''}
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

  importNext20Button.disabled =
    isBatchImporting || isSingleImporting || missingGames.length === 0;
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

      isSingleImporting = true;
      loadGamesButton.disabled = true;
      renderGames();

      const result = await importPlayerGameStats(game);

      isSingleImporting = false;
      loadGamesButton.disabled = false;

      if (result) {
        importedGameIds.add(normalize(game.game_id));
      }

      renderGames();
    });
  });
}

async function importPlayerGameStats(game) {
  try {
    statusMessage.textContent =
      `Dohvaćam i spremam statistiku za ${game.game_id}...`;

    const response = await fetch('/api/player-game-stats/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameId: game.game_id })
    });

    const data = await response.json();

    if (!response.ok || data.imported !== true) {
      console.error(data);
      statusMessage.textContent =
        `Statistika za ${game.game_id} nije spremljena: ${data.error || 'nepoznata greška'}`;
      return null;
    }

    console.log('PLAYER GAME STATS IMPORT:', data);

    statusMessage.textContent =
      `Imported: spremljeno ${data.stored}/${data.expected} redaka za ${game.game_id} ` +
      `(${data.source}, novih ${data.inserted}).`;

    return data;
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      `Statistika za ${game.game_id} nije spremljena.`;

    return null;
  }
}

async function importNext20MissingGames() {
  const missingGames = getMissingGames().slice(0, 20);

  if (!missingGames.length) {
    statusMessage.textContent = 'Nema utakmica za import.';
    return;
  }

  isBatchImporting = true;
  importNext20Button.disabled = true;
  loadGamesButton.disabled = true;
  renderGames();

  let importedCount = 0;
  let insertedRows = 0;

  for (let i = 0; i < missingGames.length; i++) {
    const game = missingGames[i];

    statusMessage.textContent =
      `Importing ${i + 1} / ${missingGames.length}: ${game.game_id}`;

    const result = await importPlayerGameStats(game);

    if (result) {
      importedCount += 1;
      insertedRows += result.inserted;
      importedGameIds.add(normalize(game.game_id));
      renderGames();
    }
  }

  isBatchImporting = false;
  loadGamesButton.disabled = false;
  renderGames();

  statusMessage.textContent =
    `Finished. Verified ${importedCount}/${missingGames.length} games; ` +
    `stored ${insertedRows} new player rows.`;
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
