const teamForm = document.getElementById('teamForm');
const formMessage = document.getElementById('formMessage');

const loadTeamsButton = document.getElementById('loadTeamsButton');
const loadDbTeamsButton = document.getElementById('loadDbTeamsButton');

const apiTeamsTableBody = document.getElementById('apiTeamsTableBody');
const dbTeamsTableBody = document.getElementById('dbTeamsTableBody');

let apiTeamsData = [];
let dbTeamsData = [];

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase();
}

function renderApiTeams(teams) {
  if (!teams.length) {
    apiTeamsTableBody.innerHTML = `
      <tr>
        <td colspan="2">Nema timova.</td>
      </tr>
    `;
    return;
  }

  const html = teams.map((team, index) => `
    <tr data-api-index="${index}">
      <td class="api-team-id-cell">${team.teamId ?? ''}</td>
      <td class="api-abbreviation-cell">${team.abbreviation ?? ''}</td>
    </tr>
  `).join('');

  apiTeamsTableBody.innerHTML = html;
}

function renderDbTeams(teams) {
  if (!teams.length) {
    dbTeamsTableBody.innerHTML = `
      <tr>
        <td colspan="8">Nema spremljenih timova.</td>
      </tr>
    `;
    return;
  }

  const html = teams.map((team, index) => `
    <tr data-db-index="${index}">
      <td>${team.id ?? ''}</td>
      <td class="db-team-id-cell">${team.team_id ?? ''}</td>
      <td class="db-abbreviation-cell">${team.abbreviation ?? ''}</td>
      <td>${team.city ?? ''}</td>
      <td>${team.nickname ?? ''}</td>
      <td>${team.full_name ?? ''}</td>
      <td>${team.conference ?? ''}</td>
      <td>
        <button type="button" class="update-team-button" data-id="${team.id}">Update</button>
      </td>
    </tr>
  `).join('');

  dbTeamsTableBody.innerHTML = html;

  const updateButtons = dbTeamsTableBody.querySelectorAll('.update-team-button');
  updateButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const team = dbTeamsData.find((item) => String(item.id) === String(id));

      if (!team) return;

      document.getElementById('edit_id').value = team.id ?? '';
      document.getElementById('team_id').value = team.team_id ?? '';
      document.getElementById('abbreviation').value = team.abbreviation ?? '';
      document.getElementById('city').value = team.city ?? '';
      document.getElementById('nickname').value = team.nickname ?? '';
      document.getElementById('full_name').value = team.full_name ?? '';
      document.getElementById('conference').value = team.conference ?? '';

      document.getElementById('saveTeamButton').textContent = 'Update Team';
      formMessage.textContent = `Editing row ID ${team.id}`;
    });
  });
}

function compareTeams() {
  const apiTeamIds = new Set(apiTeamsData.map(team => normalizeValue(team.teamId)));
  const apiAbbreviations = new Set(apiTeamsData.map(team => normalizeValue(team.abbreviation)));

  const dbTeamIds = new Set(dbTeamsData.map(team => normalizeValue(team.team_id)));
  const dbAbbreviations = new Set(dbTeamsData.map(team => normalizeValue(team.abbreviation)));

  const apiRows = apiTeamsTableBody.querySelectorAll('tr[data-api-index]');
  apiRows.forEach((row, index) => {
    const team = apiTeamsData[index];

    const teamIdCell = row.querySelector('.api-team-id-cell');
    const abbreviationCell = row.querySelector('.api-abbreviation-cell');

    teamIdCell.classList.remove('mismatch-cell');
    abbreviationCell.classList.remove('mismatch-cell');

    const normalizedTeamId = normalizeValue(team.teamId);
    const normalizedAbbreviation = normalizeValue(team.abbreviation);

    if (normalizedTeamId && !dbTeamIds.has(normalizedTeamId)) {
      teamIdCell.classList.add('mismatch-cell');
    }

    if (normalizedAbbreviation && !dbAbbreviations.has(normalizedAbbreviation)) {
      abbreviationCell.classList.add('mismatch-cell');
    }
  });

  const dbRows = dbTeamsTableBody.querySelectorAll('tr[data-db-index]');
  dbRows.forEach((row, index) => {
    const team = dbTeamsData[index];

    const teamIdCell = row.querySelector('.db-team-id-cell');
    const abbreviationCell = row.querySelector('.db-abbreviation-cell');

    teamIdCell.classList.remove('mismatch-cell');
    abbreviationCell.classList.remove('mismatch-cell');

    const normalizedTeamId = normalizeValue(team.team_id);
    const normalizedAbbreviation = normalizeValue(team.abbreviation);

    if (normalizedTeamId && !apiTeamIds.has(normalizedTeamId)) {
      teamIdCell.classList.add('mismatch-cell');
    }

    if (normalizedAbbreviation && !apiAbbreviations.has(normalizedAbbreviation)) {
      abbreviationCell.classList.add('mismatch-cell');
    }
  });
}

teamForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const editId = document.getElementById('edit_id').value;

  const payload = {
    team_id: Number(document.getElementById('team_id').value) || null,
    abbreviation: document.getElementById('abbreviation').value,
    city: document.getElementById('city').value,
    nickname: document.getElementById('nickname').value,
    full_name: document.getElementById('full_name').value,
    conference: document.getElementById('conference').value
  };

  try {
    const isEditMode = Boolean(editId);

    const response = await fetch(
      isEditMode ? `/api/teams/${editId}` : '/api/teams',
      {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      formMessage.textContent = `Greška: ${data.error || 'Spremanje nije uspjelo.'}`;
      return;
    }

    formMessage.textContent = isEditMode ? 'Team ažuriran.' : 'Team spremljen.';
    teamForm.reset();
    document.getElementById('edit_id').value = '';
    document.getElementById('saveTeamButton').textContent = 'Save Team';

    await loadDbTeams();
  } catch (error) {
    console.error(error);
    formMessage.textContent = 'Dogodila se greška.';
  }
});

async function loadApiTeams() {
  try {
    const response = await fetch('/api/teams');
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert('Greška kod dohvaćanja timova iz API-ja.');
      return;
    }

    const resultSet = data.resultSets[0];

    if (!resultSet || !Array.isArray(resultSet.rowSet)) {
      apiTeamsData = [];
      renderApiTeams([]);
      compareTeams();
      return;
    }

    apiTeamsData = resultSet.rowSet.map((row) => ({
      teamId: row[1],
      abbreviation: row[4]
    }));

    renderApiTeams(apiTeamsData);
    compareTeams();
  } catch (error) {
    console.error(error);
    alert('Dogodila se greška.');
  }
}

async function loadDbTeams() {
  try {
    const response = await fetch('/api/teams/db');
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert('Greška kod dohvaćanja timova iz baze.');
      return;
    }

    dbTeamsData = data;
    renderDbTeams(dbTeamsData);
    compareTeams();
  } catch (error) {
    console.error(error);
    alert('Dogodila se greška.');
  }
}

loadTeamsButton.addEventListener('click', loadApiTeams);
loadDbTeamsButton.addEventListener('click', loadDbTeams);