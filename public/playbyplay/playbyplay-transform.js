let startingLineups = {};
let lineupTimeline = [];

let latestGameId = null;
let latestPlays = [];

function getResultSet(data, name) {
  return data.resultSets?.find(
    (resultSet) => resultSet.name === name
  );
}

function rowToObject(headers, row) {
  const obj = {};

  headers.forEach((header, index) => {
    obj[header] = row[index];
  });

  return obj;
}

function buildStartingLineups(boxScoreData) {
  const playerStats = getResultSet(
    boxScoreData,
    'PlayerStats'
  );

  if (!playerStats) {
    return {};
  }

  const rows = playerStats.rowSet.map((row) =>
    rowToObject(playerStats.headers, row)
  );

  const lineups = {};

  rows.forEach((player) => {
    const startPosition = String(
      player.START_POSITION || ''
    ).trim();

    if (!startPosition) {
      return;
    }

    const teamId = player.TEAM_ID;

    if (!lineups[teamId]) {
      lineups[teamId] = [];
    }

    lineups[teamId].push({
      personId: player.PLAYER_ID
    });
  });

  return lineups;
}

async function loadStartingLineups(gameId) {
  try {
    const response = await fetch(
      `/api/boxscore/traditional-v2?gameId=${gameId}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return {};
    }

    startingLineups = buildStartingLineups(data);

    console.log('STARTING LINEUPS:', startingLineups);

    return startingLineups;
  } catch (error) {
    console.error(error);
    return {};
  }
}

function startingLineupsToIdArrays(lineups) {
  const result = {};

  Object.keys(lineups).forEach((teamId) => {
    result[teamId] = lineups[teamId].map((player) =>
      player.personId
    );
  });

  return result;
}

function createTimelineSnapshot(timestamp, lineups) {
  const snapshot = {
    timestamp
  };

  Object.keys(lineups).forEach((teamId) => {
    snapshot[teamId] = [...lineups[teamId]];
  });

  return snapshot;
}

function buildTimestamp(play) {
  return `Q${play.period}${play.clock}`;
}

function applySubstitutionPair(
  lineups,
  teamId,
  outPersonId,
  inPersonId
) {
  if (!lineups[teamId]) {
    lineups[teamId] = [];
  }

  lineups[teamId] = lineups[teamId].filter(
    (personId) => Number(personId) !== Number(outPersonId)
  );

  const alreadyExists = lineups[teamId].some(
    (personId) => Number(personId) === Number(inPersonId)
  );

  if (!alreadyExists) {
    lineups[teamId].push(inPersonId);
  }
}

async function buildLineupTimeline(gameId, plays) {
  const starters = await loadStartingLineups(gameId);

  const currentLineups =
    startingLineupsToIdArrays(starters);

  lineupTimeline = [
    createTimelineSnapshot(
      'Q1PT12M00.00S',
      currentLineups
    )
  ];

  const sortedPlays = [...plays].sort((a, b) => {
    const orderA =
      a.orderNumber ?? a.actionNumber ?? 0;

    const orderB =
      b.orderNumber ?? b.actionNumber ?? 0;

    return orderA - orderB;
  });

  const timestampGroups = {};

  sortedPlays.forEach((play) => {
    if (play.actionType !== 'substitution') {
      return;
    }

    const timestamp = buildTimestamp(play);
    const teamId = play.teamId;

    if (!timestampGroups[timestamp]) {
      timestampGroups[timestamp] = {};
    }

    if (!timestampGroups[timestamp][teamId]) {
      timestampGroups[timestamp][teamId] = {
        outs: [],
        ins: []
      };
    }

    if (play.subType === 'out') {
      timestampGroups[timestamp][teamId]
        .outs
        .push(play.personId);
    }

    if (play.subType === 'in') {
      timestampGroups[timestamp][teamId]
        .ins
        .push(play.personId);
    }
  });

  Object.entries(timestampGroups).forEach(
    ([timestamp, teams]) => {
      Object.entries(teams).forEach(
        ([teamId, substitutions]) => {
          const {
            outs,
            ins
          } = substitutions;

          const pairCount = Math.min(
            outs.length,
            ins.length
          );

          for (let i = 0; i < pairCount; i++) {
            applySubstitutionPair(
              currentLineups,
              teamId,
              outs[i],
              ins[i]
            );
          }
        }
      );

      lineupTimeline.push(
        createTimelineSnapshot(
          timestamp,
          currentLineups
        )
      );
    }
  );

  console.log(
    'LINEUP TIMELINE:',
    lineupTimeline
  );

  enableTimelineButton();

  return lineupTimeline;
}

function getLineupTimeline() {
  return lineupTimeline;
}

function getSelectedGameIdFromPage() {
  const selectedGameInfo =
    document.getElementById('selectedGameInfo');

  if (!selectedGameInfo) {
    return null;
  }

  const text = selectedGameInfo.textContent || '';
  const match = text.match(/\b\d{10}\b/);

  return match ? match[0] : null;
}

function enableTimelineButton() {
  const button = document.getElementById('loadTimelineButton');

  if (button) {
    button.disabled = false;
  }
}

function enableImportGameDataButton() {
  const button = document.getElementById('importGameDataButton');

  if (button) {
    button.disabled = false;
  }
}

async function importLineupTimeline() {
  try {
    const gameId = getSelectedGameIdFromPage();

    if (!gameId) {
      alert('Nijedna utakmica nije učitana.');
      return;
    }

    if (!lineupTimeline.length) {
      alert('Timeline nije generiran.');
      return;
    }

    const teamIds = Object.keys(lineupTimeline[0])
      .filter((key) => key !== 'timestamp');

    if (teamIds.length !== 2) {
      alert('Ne mogu odrediti timove.');
      return;
    }

    const rows = lineupTimeline.map((snapshot) => ({
      game_id: gameId,
      timestamp_key: snapshot.timestamp,

      home_team_id: Number(teamIds[0]),
      away_team_id: Number(teamIds[1]),

      lineup_home: snapshot[teamIds[0]],
      lineup_away: snapshot[teamIds[1]]
    }));

    const response = await fetch('/api/lineup-timeline/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rows })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert(`Greška: ${data.error}`);
      return;
    }

    console.log('TIMELINE IMPORT:', data);

    alert(`Importirano ${data.inserted} timeline redaka.`);
  } catch (error) {
    console.error(error);
    alert('Greška kod importa timelinea.');
  }
}

function mapPlayToDbRow(gameId, play) {
  return {
    game_id: gameId,
    action_number: play.actionNumber,

    period: play.period ?? null,
    clock: play.clock ?? null,

    action_type: play.actionType ?? null,
    sub_type: play.subType ?? null,
    descriptor: play.descriptor ?? null,

    person_id: play.personId ?? null,

    x: play.x ?? null,
    y: play.y ?? null,

    side: play.side ?? null,

    shot_result: play.shotResult ?? null,
    shot_distance: play.shotDistance ?? null,

    assist_person_id: play.assistPersonId ?? null,
    block_person_id: play.blockPersonId ?? null,
    steal_person_id: play.stealPersonId ?? null,
    foul_drawn_person_id: play.foulDrawnPersonId ?? null,

    jump_ball_won_person_id: play.jumpBallWonPersonId ?? null,
    jump_ball_lost_person_id: play.jumpBallLostPersonId ?? null,
    jump_ball_recoverd_person_id:
      play.jumpBallRecoverdPersonId ??
      play.jumpBallRecoveredPersonId ??
      null,

    qualifiers: Array.isArray(play.qualifiers)
      ? play.qualifiers
      : [],

    x_legacy: play.xLegacy ?? null,
    y_legacy: play.yLegacy ?? null
  };
}

function shouldImportPlay(play) {
  const actionType = String(play.actionType || '').toLowerCase();

  return ![
    'period',
    'game',
    'substitution'
  ].includes(actionType);
}

async function importGameData() {
  try {
    if (!latestGameId) {
      alert('Nijedna utakmica nije učitana.');
      return;
    }

    if (!Array.isArray(latestPlays) || !latestPlays.length) {
      alert('Nema play-by-play podataka za import.');
      return;
    }

    const rows = latestPlays
      .filter(shouldImportPlay)
      .map((play) => mapPlayToDbRow(latestGameId, play));

    if (!rows.length) {
      alert('Nema redaka za import nakon filtriranja.');
      return;
    }

    const batchSize = 20;
    let insertedTotal = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const response = await fetch('/api/play-by-play/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rows: batch
        })
      });

      let data = null;

      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw jsonError;
      }

      if (!response.ok) {
        console.error(data);
        alert(`Greška: ${data.error}`);
        return;
      }

      insertedTotal += data.inserted;

      console.log(
        `Imported batch ${i / batchSize + 1}:`,
        data
      );
    }

    alert(`Importirano ${insertedTotal} play-by-play redaka.`);
  } catch (error) {
    console.error(error);
    alert('Greška kod importa game data.');
  }
}

function setupTimelineButton() {
  const button = document.getElementById('loadTimelineButton');

  if (!button) {
    return;
  }

  button.addEventListener('click', importLineupTimeline);
}

function setupImportGameDataButton() {
  const button = document.getElementById('importGameDataButton');

  if (!button) {
    return;
  }

  button.addEventListener('click', importGameData);
}

function hookIntoRenderPlays() {
  if (typeof window.renderPlays !== 'function') {
    return false;
  }

  if (window.renderPlays.__lineupHooked) {
    return true;
  }

  const originalRenderPlays = window.renderPlays;

  window.renderPlays = function wrappedRenderPlays(plays) {
    originalRenderPlays(plays);

    const gameId = getSelectedGameIdFromPage();

    if (!gameId || !Array.isArray(plays) || !plays.length) {
      return;
    }

    latestGameId = gameId;
    latestPlays = plays;

    enableImportGameDataButton();

    buildLineupTimeline(gameId, plays);
  };

  window.renderPlays.__lineupHooked = true;

  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  setupTimelineButton();
  setupImportGameDataButton();
});

const lineupHookInterval = setInterval(() => {
  const hooked = hookIntoRenderPlays();

  if (hooked) {
    clearInterval(lineupHookInterval);
  }
}, 100);