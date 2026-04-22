const playerForm = document.getElementById('playerForm');
const formMessage = document.getElementById('formMessage');

const loadPlayersButton = document.getElementById('loadPlayersButton');
const loadDbPlayersButton = document.getElementById('loadDbPlayersButton');
const seasonSelect = document.getElementById('seasonSelect');
const statusMessage = document.getElementById('statusMessage');

const playersTableBody = document.getElementById('playersTableBody');
const dbPlayersTableBody = document.getElementById('dbPlayersTableBody');

const apiSortableHeaders = document.querySelectorAll('th[data-sort-key]');
const dbSortableHeaders = document.querySelectorAll('th[data-db-sort-key]');

let playersData = [];
let dbPlayersData = [];

let apiSort = { key: null, direction: 'desc' };
let dbSort = { key: null, direction: 'desc' };

// ---------------- UTIL ----------------

function formatDate(date) {
  if (!date) return '';
  return date.split('T')[0];
}

function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase();
}

function compare(a, b, dir) {
  const aNum = typeof a === 'number';
  const bNum = typeof b === 'number';

  let res = 0;

  if (aNum && bNum) {
    res = a - b;
  } else {
    const A = normalize(a);
    const B = normalize(b);
    if (A < B) res = -1;
    if (A > B) res = 1;
  }

  return dir === 'asc' ? res : -res;
}

function splitName(value) {
  if (!value) return { first: '', last: '' };
  const [last, first] = value.split(',');
  return {
    first: (first || '').trim(),
    last: (last || '').trim()
  };
}

// ---------------- RENDER ----------------

function renderApi() {
  const apiIds = new Set(dbPlayersData.map(p => normalize(p.player_id)));

  playersTableBody.innerHTML = playersData.map((p, i) => {
    const missing = !apiIds.has(normalize(p.playerId));

    return `
      <tr data-api-index="${i}">
        <td class="api-id ${missing ? 'mismatch-cell' : ''}">${p.playerId}</td>
        <td>${p.displayLastCommaFirst}</td>
        <td>${p.firstName}</td>
        <td>${p.lastName}</td>
        <td>${formatDate(p.birthdate)}</td>
        <td>${p.rosterStatus}</td>
        <td>${p.teamId}</td>
        <td>${p.teamAbbreviation}</td>
      </tr>
    `;
  }).join('');
}

function renderDb() {
  const apiMap = new Map(
    playersData.map(p => [normalize(p.playerId), p])
  );

  dbPlayersTableBody.innerHTML = dbPlayersData.map((p, i) => {
    const api = apiMap.get(normalize(p.player_id));

    const missing = !api;

    let conflictTeam = false;
    let conflictTeamId = false;
    let conflictRoster = false;

    if (api) {
        if (normalize(api.teamId) !== normalize(p.team_id)) {
            conflictTeamId = true;
        }
        if (normalize(api.teamAbbreviation) !== normalize(p.team_abbreviation)) {
            conflictTeam = true;
        }
        if (normalize(api.rosterStatus) !== normalize(p.roster_status)) {
            conflictRoster = true;
        }
    }

    return `
      <tr data-db-index="${i}">
        <td>${p.id}</td>
        <td class="${missing ? 'mismatch-cell' : ''}">${p.player_id}</td>
        <td>${p.first_name}</td>
        <td>${p.last_name}</td>
        <td>${formatDate(p.birthdate)}</td>
        <td class="${conflictRoster ? 'conflict-cell' : ''}">${p.roster_status}</td>
        <td class="${conflictTeamId ? 'conflict-cell' : ''}">${p.team_id}</td>
        <td class="${conflictTeam ? 'conflict-cell' : ''}">${p.team_abbreviation}</td>
        <td>
          <button class="edit-btn" data-id="${p.id}">Edit</button>
        </td>
      </tr>
    `;
  }).join('');

  attachEditEvents();
}

// ---------------- EDIT ----------------

function attachEditEvents() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const player = dbPlayersData.find(p => String(p.id) === id);

      document.getElementById('edit_id').value = player.id;
      document.getElementById('player_id').value = player.player_id;
      document.getElementById('first_name').value = player.first_name;
      document.getElementById('last_name').value = player.last_name;
      document.getElementById('birthdate').value = formatDate(player.birthdate);
      document.getElementById('roster_status').value = player.roster_status;
      document.getElementById('team_id').value = player.team_id;
      document.getElementById('team_abbreviation').value = player.team_abbreviation;

      document.getElementById('savePlayerButton').textContent = 'Update Player';
      formMessage.textContent = `Editing ID ${player.id}`;
    });
  });
}

document.getElementById('cancelEditButton').addEventListener('click', () => {
  playerForm.reset();
  document.getElementById('edit_id').value = '';
  document.getElementById('savePlayerButton').textContent = 'Save Player';
  formMessage.textContent = '';
});

// ---------------- SORT ----------------

apiSortableHeaders.forEach(h => {
  h.addEventListener('click', () => {
    const key = h.dataset.sortKey;

    apiSort.direction = apiSort.key === key && apiSort.direction === 'desc' ? 'asc' : 'desc';
    apiSort.key = key;

    playersData.sort((a, b) => compare(a[key], b[key], apiSort.direction));
    renderApi();
  });
});

dbSortableHeaders.forEach(h => {
  h.addEventListener('click', () => {
    const key = h.dataset.dbSortKey;

    dbSort.direction = dbSort.key === key && dbSort.direction === 'desc' ? 'asc' : 'desc';
    dbSort.key = key;

    dbPlayersData.sort((a, b) => compare(a[key], b[key], dbSort.direction));
    renderDb();
  });
});

// ---------------- FORM ----------------

playerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const editId = document.getElementById('edit_id').value;

  const payload = {
    player_id: Number(player_id.value) || null,
    first_name: first_name.value,
    last_name: last_name.value,
    birthdate: birthdate.value || null,
    roster_status: roster_status.value,
    team_id: Number(team_id.value) || null,
    team_abbreviation: team_abbreviation.value
  };

  const url = editId ? `/api/players/db/${editId}` : `/api/players/db`;
  const method = editId ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    formMessage.textContent = 'Greška';
    return;
  }

  formMessage.textContent = editId ? 'Updated' : 'Inserted';

  playerForm.reset();
  document.getElementById('edit_id').value = '';
  document.getElementById('savePlayerButton').textContent = 'Save Player';

  await loadDb();
});

// ---------------- LOAD ----------------

async function loadDb() {
  const res = await fetch('/api/players/db');
  dbPlayersData = await res.json();
  renderDb();
}

loadDbPlayersButton.addEventListener('click', loadDb);

loadPlayersButton.addEventListener('click', async () => {
  const season = seasonSelect.value;

  const res = await fetch(`/api/players?season=${season}&current=1`);
  const data = await res.json();

  const rows = data.resultSets[0].rowSet;

  playersData = rows.map(r => {
    const names = splitName(r[1]);

    return {
      playerId: r[0],
      displayLastCommaFirst: r[1],
      firstName: names.first,
      lastName: names.last,
      birthdate: '',
      rosterStatus: r[3],
      teamId: r[8],
      teamAbbreviation: r[11]
    };
  });

  renderApi();

  // enrich 10
  for (let i = 0; i < Math.min(10, playersData.length); i++) {
    const p = playersData[i];

    const r = await fetch(`/api/player-info?playerId=${p.playerId}`);
    const d = await r.json();

    const row = d.resultSets.find(x => x.name === 'CommonPlayerInfo')?.rowSet?.[0];
    if (!row) continue;

    p.firstName = row[1];
    p.lastName = row[2];
    p.birthdate = row[7];

    renderApi();
  }

  renderDb();
});