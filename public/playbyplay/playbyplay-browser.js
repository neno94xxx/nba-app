const seasonSelect = document.getElementById('seasonSelect');
const gameTypeSelect = document.getElementById('gameTypeSelect');
const teamInput = document.getElementById('teamInput');
const loadGamesButton = document.getElementById('loadGamesButton');
const statusMessage = document.getElementById('statusMessage');

const gamesTableBody = document.getElementById('gamesTableBody');
const selectedGameInfo = document.getElementById('selectedGameInfo');
const playsTableBody = document.getElementById('playsTableBody');

let gamesData = [];
let selectedGame = null;

let playsData = [];

let playsSort = {
  key: null,
  direction: 'asc'
};

function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase();
}

function formatDate(date) {
  if (!date) return '';
  return String(date).split('T')[0];
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

function safe(value) {
  if (value === null || value === undefined) return '';

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

function getFirstExisting(play, keys) {
  for (const key of keys) {
    if (play[key] !== null && play[key] !== undefined) {
      return play[key];
    }
  }

  return '';
}

function compareValues(a, b, direction) {
  const valueA = a ?? '';
  const valueB = b ?? '';

  const numberA = Number(valueA);
  const numberB = Number(valueB);

  const isNumberA = !Number.isNaN(numberA) && valueA !== '';
  const isNumberB = !Number.isNaN(numberB) && valueB !== '';

  let result = 0;

  if (isNumberA && isNumberB) {
    result = numberA - numberB;
  } else {
    const stringA = String(valueA).toUpperCase();
    const stringB = String(valueB).toUpperCase();

    if (stringA < stringB) result = -1;
    if (stringA > stringB) result = 1;
  }

  return direction === 'asc' ? result : -result;
}

function getSortValue(play, key) {
  if (key === 'playerNameI') {
    return getFirstExisting(play, ['playerNameI', 'playerName', 'personName']);
  }

  if (key === 'assistPlayerName') {
    return getFirstExisting(play, ['assistPlayerNameI', 'assistPlayerName']);
  }

  if (key === 'blockPlayerName') {
    return getFirstExisting(play, ['blockPlayerNameI', 'blockPlayerName']);
  }

  if (key === 'stealPlayerName') {
    return getFirstExisting(play, ['stealPlayerNameI', 'stealPlayerName']);
  }

  if (key === 'foulDrawnPlayerName') {
    return getFirstExisting(play, ['foulDrawnPlayerNameI', 'foulDrawnPlayerName']);
  }

  if (key === 'jumpBallRecoverdPersonId') {
    return getFirstExisting(play, ['jumpBallRecoveredPersonId', 'jumpBallRecoverdPersonId']);
  }

  return play[key];
}

function renderGames() {
  if (!gamesData.length) {
    gamesTableBody.innerHTML = `
      <tr>
        <td colspan="8">Nema utakmica za odabrane filtere.</td>
      </tr>
    `;
    return;
  }

  gamesTableBody.innerHTML = gamesData.map((game, index) => {
    const isSelected =
      selectedGame &&
      String(selectedGame.game_id) === String(game.game_id);

    return `
      <tr class="${isSelected ? 'selected-row' : ''}">
        <td>${game.game_id}</td>
        <td>${game.game_type ?? ''}</td>
        <td>${formatDate(game.game_date)}</td>
        <td>${game.matchup ?? ''}</td>
        <td>${game.team_a_abbreviation ?? ''}</td>
        <td>${game.team_b_abbreviation ?? ''}</td>
        <td>${buildScore(game)}</td>
        <td>
          <button
            class="select-game-button"
            data-index="${index}"
            type="button"
          >
            Select
          </button>
        </td>
      </tr>
    `;
  }).join('');

  attachSelectEvents();
}

function renderSelectedGame() {
  if (!selectedGame) {
    selectedGameInfo.textContent = 'Nije odabrana utakmica.';
    return;
  }

  selectedGameInfo.textContent =
    `${selectedGame.game_id} | ${selectedGame.game_type} | ${formatDate(selectedGame.game_date)} | ${selectedGame.matchup}`;
}

function renderPlays(plays) {
  if (!plays.length) {
    playsTableBody.innerHTML = `
      <tr>
        <td colspan="50">Nema play-by-play podataka.</td>
      </tr>
    `;
    return;
  }

  playsTableBody.innerHTML = plays.map((play) => `
    <tr>
      <td>${safe(play.actionNumber)}</td>
      <td>${safe(play.period)}</td>
      <td>${safe(play.clock)}</td>
      <td>${safe(play.actionType)}</td>
      <td>${safe(play.subType)}</td>
      <td>${safe(play.descriptor)}</td>

      <td>${safe(play.teamId)}</td>
      <td>${safe(play.teamTricode)}</td>
      <td>${safe(play.personId)}</td>
      <td>${safe(getFirstExisting(play, ['playerNameI', 'playerName', 'personName']))}</td>
      <td>${safe(play.description)}</td>

      <td>${safe(play.scoreAway)}</td>
      <td>${safe(play.scoreHome)}</td>
      <td>${safe(play.possession)}</td>

      <td>${safe(play.x)}</td>
      <td>${safe(play.y)}</td>
      <td>${safe(play.side)}</td>
      <td>${safe(play.isFieldGoal)}</td>
      <td>${safe(play.shotResult)}</td>
      <td>${safe(play.shotDistance)}</td>
      <td>${safe(play.pointsTotal)}</td>

      <td>${safe(play.assistPersonId)}</td>
      <td>${safe(getFirstExisting(play, ['assistPlayerNameI', 'assistPlayerName']))}</td>

      <td>${safe(play.blockPersonId)}</td>
      <td>${safe(getFirstExisting(play, ['blockPlayerNameI', 'blockPlayerName']))}</td>

      <td>${safe(play.stealPersonId)}</td>
      <td>${safe(getFirstExisting(play, ['stealPlayerNameI', 'stealPlayerName']))}</td>

      <td>${safe(play.foulDrawnPersonId)}</td>
      <td>${safe(getFirstExisting(play, ['foulDrawnPlayerNameI', 'foulDrawnPlayerName']))}</td>

      <td>${safe(play.freeThrowNum)}</td>
      <td>${safe(play.freeThrowTotal)}</td>

      <td>${safe(play.reboundTotal)}</td>
      <td>${safe(play.reboundDefensiveTotal)}</td>
      <td>${safe(play.reboundOffensiveTotal)}</td>

      <td>${safe(play.turnoverTotal)}</td>

      <td>${safe(play.jumpBallWonPersonId)}</td>
      <td>${safe(play.jumpBallWonPlayerName)}</td>

      <td>${safe(play.jumpBallLostPersonId)}</td>
      <td>${safe(play.jumpBallLostPlayerName)}</td>

      <td>${safe(getFirstExisting(play, ['jumpBallRecoveredPersonId', 'jumpBallRecoverdPersonId']))}</td>
      <td>${safe(play.jumpBallRecoveredName)}</td>

      <td>${safe(play.qualifiers)}</td>
      <td>${safe(play.personIdsFilter)}</td>

      <td>${safe(play.timeActual)}</td>
      <td>${safe(play.edited)}</td>
      <td>${safe(play.orderNumber)}</td>
      <td>${safe(play.periodType)}</td>

      <td>${safe(play.xLegacy)}</td>
      <td>${safe(play.yLegacy)}</td>
      <td>${safe(play.isTargetScoreLastPeriod)}</td>
    </tr>
  `).join('');
}

function attachPlaySortEvents() {
  document.querySelectorAll('th[data-play-sort]').forEach((header) => {
    header.addEventListener('click', () => {
      const key = header.dataset.playSort;

      if (playsSort.key === key) {
        playsSort.direction =
          playsSort.direction === 'asc'
            ? 'desc'
            : 'asc';
      } else {
        playsSort.key = key;
        playsSort.direction = 'asc';
      }

      playsData.sort((a, b) => {
        return compareValues(
          getSortValue(a, key),
          getSortValue(b, key),
          playsSort.direction
        );
      });

      renderPlays(playsData);
    });
  });
}

function attachSelectEvents() {
  document.querySelectorAll('.select-game-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = Number(button.dataset.index);
      selectedGame = gamesData[index];

      renderSelectedGame();
      renderGames();

      await loadPlayByPlay(selectedGame);
    });
  });
}

async function loadGames() {
  const season = seasonSelect.value;
  const gameType = gameTypeSelect.value;
  const team = normalize(teamInput.value);
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

  if (team) {
    params.append('team', team);
  }

  statusMessage.textContent = 'Loading games...';

  try {
    const response = await fetch(`/api/games/db/search?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja utakmica.';
      return;
    }

    gamesData = data;
    selectedGame = null;
    playsData = [];
    playsSort = {
      key: null,
      direction: 'asc'
    };

    renderGames();
    renderSelectedGame();
    renderPlays([]);

    statusMessage.textContent = `Loaded ${gamesData.length} games.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Dogodila se greška kod dohvaćanja utakmica.';
  }
}

async function loadPlayByPlay(game) {
  try {
    statusMessage.textContent = `Loading play-by-play for ${game.game_id}...`;

    const response = await fetch(`/api/play-by-play?gameId=${game.game_id}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja play-by-play podataka.';
      return;
    }

    console.log('PlayByPlay response:', data);

    playsData = data.game?.actions || [];

    playsSort = {
      key: null,
      direction: 'asc'
    };

    renderPlays(playsData);
    attachPlaySortEvents();

    statusMessage.textContent =
      `Loaded ${playsData.length} play-by-play actions for game ${game.game_id}.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Dogodila se greška kod play-by-play dohvaćanja.';
  }
}

loadGamesButton.addEventListener('click', loadGames);