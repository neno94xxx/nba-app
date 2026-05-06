const loadPlayersButton = document.getElementById('loadPlayersButton');
const playersTableBody = document.getElementById('playersTableBody');
const historyTableBody = document.getElementById('historyTableBody');

let playersData = [];
let teamsData = [];

function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const seasonStartYear = month >= 10 ? year : year - 1;
  const seasonEndShort = String(seasonStartYear + 1).slice(-2);

  return `${seasonStartYear}-${seasonEndShort}`;
}

function getPreviousSeason(season) {
  const startYear = Number(season.split('-')[0]);
  const previousStartYear = startYear - 1;
  const previousEndShort = String(previousStartYear + 1).slice(-2);

  return `${previousStartYear}-${previousEndShort}`;
}

function parseGameDateToISO(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
}

function extractTeamAbbreviationFromMatchup(matchup) {
  if (!matchup) return '';
  return matchup.substring(0, 3).trim().toUpperCase();
}

function renderPlayers(players) {
  if (!players.length) {
    playersTableBody.innerHTML = `
      <tr>
        <td colspan="4">Nema igrača</td>
      </tr>
    `;
    return;
  }

  playersTableBody.innerHTML = players.map((p) => `
    <tr class="player-row" data-player-id="${p.player_id}">
      <td>${p.player_id ?? ''}</td>
      <td>${p.first_name ?? ''}</td>
      <td>${p.last_name ?? ''}</td>
      <td>
        <button
          class="update-player-history-button"
          data-player-id="${p.player_id}"
        >
          Update
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.player-row').forEach((row) => {
    row.addEventListener('click', async () => {
      const playerId = row.dataset.playerId;
      const player = playersData.find((p) => String(p.player_id) === String(playerId));

      if (!player) {
        console.error('Player nije pronađen:', playerId);
        return;
      }

      await loadSavedPlayerHistory(player);
    });
  });

  document.querySelectorAll('.update-player-history-button').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const playerId = button.dataset.playerId;
      const player = playersData.find((p) => String(p.player_id) === String(playerId));

      if (!player) {
        console.error('Player nije pronađen:', playerId);
        return;
      }

      await updatePlayerHistory(player);
    });
  });
}

function renderHistory(historyRows) {
  if (!historyRows.length) {
    historyTableBody.innerHTML = `
      <tr>
        <td>Nema history podataka.</td>
      </tr>
    `;
    return;
  }

  historyTableBody.innerHTML = historyRows.map((row) => `
    <tr>
      <td>${row.previous_team_name ?? 'START'}</td>
      <td>→</td>
      <td>${row.current_team_name ?? ''}</td>
      <td>${row.first_game_date_with_new_team ?? ''}</td>
    </tr>
  `).join('');
}

async function loadPlayers() {
  try {
    const res = await fetch('/api/players/db');
    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      return;
    }

    playersData = data;
    renderPlayers(playersData);
  } catch (error) {
    console.error(error);
  }
}

async function loadTeams() {
  const res = await fetch('/api/teams/db');
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Greška kod dohvaćanja timova.');
  }

  teamsData = data;
  return teamsData;
}

async function loadAllPlayerGames(playerId) {
  let season = getCurrentSeason();
  let emptySeasonsInRow = 0;
  const allGames = [];

  while (season !== '1999-00') {
    console.log(`Fetching player ${playerId}, season ${season}`);

    const res = await fetch(`/api/player-gamelog?playerId=${playerId}&season=${season}`);
    const data = await res.json();

    if (!res.ok) {
      console.error(`Greška za sezonu ${season}:`, data);
      break;
    }

    const rows = data.resultSets?.[0]?.rowSet || [];

    if (!rows.length) {
      emptySeasonsInRow += 1;

      if (emptySeasonsInRow >= 2) {
        break;
      }
    } else {
      emptySeasonsInRow = 0;

      rows.forEach((row) => {
        allGames.push({
          season,
          raw: row
        });
      });
    }

    season = getPreviousSeason(season);
  }

  return allGames;
}

function buildTimelineFromGames(allGames) {
  const gamesOldestToNewest = [...allGames].reverse();

  const timeline = [];
  let previousTeamAbbreviation = null;

  gamesOldestToNewest.forEach((game) => {
    const raw = game.raw;

    const gameDateRaw = raw[3];
    const matchup = raw[4];

    const teamAbbreviation = extractTeamAbbreviationFromMatchup(matchup);
    const gameDate = parseGameDateToISO(gameDateRaw);

    if (!teamAbbreviation || !gameDate) {
      return;
    }

    if (previousTeamAbbreviation === null) {
      timeline.push({
        type: 'initial_team',
        previousTeamAbbreviation: null,
        currentTeamAbbreviation: teamAbbreviation,
        firstGameDateWithNewTeam: gameDate
      });

      previousTeamAbbreviation = teamAbbreviation;
      return;
    }

    if (teamAbbreviation !== previousTeamAbbreviation) {
      timeline.push({
        type: 'team_change',
        previousTeamAbbreviation,
        currentTeamAbbreviation: teamAbbreviation,
        firstGameDateWithNewTeam: gameDate
      });

      previousTeamAbbreviation = teamAbbreviation;
    }
  });

  return timeline;
}

function mapTimelineToHistoryRows(player, timeline) {
  const teamsMap = new Map(
    teamsData.map((team) => [
      String(team.abbreviation).trim().toUpperCase(),
      team
    ])
  );

  return timeline.map((item) => {
    const previousTeam = item.previousTeamAbbreviation
      ? teamsMap.get(item.previousTeamAbbreviation)
      : null;

    const currentTeam = teamsMap.get(item.currentTeamAbbreviation);

    return {
      player_id: player.player_id,
      first_name: player.first_name,
      last_name: player.last_name,

      previous_team_id: previousTeam?.team_id ?? null,
      previous_team_name: previousTeam?.full_name ?? null,

      current_team_id: currentTeam?.team_id ?? null,
      current_team_name: currentTeam?.full_name ?? null,

      first_game_date_with_new_team: item.firstGameDateWithNewTeam
    };
  });
}

async function savePlayerHistory(playerId, historyRows) {
  const res = await fetch(`/api/player-history/save/${playerId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(historyRows)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Greška kod spremanja player history.');
  }

  return data;
}


async function loadSavedPlayerHistory(player) {
  try {
    historyTableBody.innerHTML = `
      <tr>
        <td>Loading saved history for ${player.first_name} ${player.last_name}...</td>
      </tr>
    `;

    const res = await fetch(`/api/player-history/${player.player_id}`);
    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      historyTableBody.innerHTML = `
        <tr>
          <td>Greška kod dohvaćanja history podataka.</td>
        </tr>
      `;
      return;
    }

    renderHistory(data);
  } catch (error) {
    console.error(error);
    historyTableBody.innerHTML = `
      <tr>
        <td>Greška kod dohvaćanja history podataka.</td>
      </tr>
    `;
  }
}




async function updatePlayerHistory(player) {
  try {
    historyTableBody.innerHTML = `
      <tr>
        <td>Loading history for ${player.first_name} ${player.last_name}...</td>
      </tr>
    `;

    if (!teamsData.length) {
      await loadTeams();
    }

    const allGames = await loadAllPlayerGames(player.player_id);
    console.log('ALL PLAYER GAMES:', allGames);

    const timeline = buildTimelineFromGames(allGames);
    console.log('PLAYER TEAM TIMELINE:', timeline);

    const historyRows = mapTimelineToHistoryRows(player, timeline);
    console.log('HISTORY ROWS FOR DB:', historyRows);

    const savedRows = await savePlayerHistory(player.player_id, historyRows);

    renderHistory(savedRows);
  } catch (error) {
    console.error(error);

    historyTableBody.innerHTML = `
      <tr>
        <td>Greška: ${error.message}</td>
      </tr>
    `;
  }
}

loadPlayersButton.addEventListener('click', loadPlayers);