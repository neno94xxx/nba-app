const teamForm = document.getElementById('teamForm');
const formMessage = document.getElementById('formMessage');
const apiTeamsMessage = document.getElementById('apiTeamsMessage');
const loadTeamsButton = document.getElementById('loadTeamsButton');
const loadDbTeamsButton = document.getElementById('loadDbTeamsButton');
const saveTeamButton = document.getElementById('saveTeamButton');
const coachImageInput = document.getElementById('coach_image');
const coachImagePreview = document.getElementById('coachImagePreview');
const apiTeamsTableBody = document.getElementById('apiTeamsTableBody');
const dbTeamsTableBody = document.getElementById('dbTeamsTableBody');

let apiTeamsData = [];
let dbTeamsData = [];
let localCoachPreviewUrl = null;

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase();
}

function safe(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSafeImageUrl(value, { allowBlob = false } = {}) {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value, window.location.origin);
    const allowedProtocols = allowBlob
      ? ['http:', 'https:', 'blob:']
      : ['http:', 'https:'];

    return allowedProtocols.includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function showCoachImagePreview(
  imageUrl,
  coachName = '',
  { allowBlob = false } = {}
) {
  const safeUrl = getSafeImageUrl(imageUrl, { allowBlob });

  if (!safeUrl) {
    coachImagePreview.innerHTML = '';
    coachImagePreview.hidden = true;
    return;
  }

  coachImagePreview.innerHTML = `
    <span>Current image</span>
    <img src="${safe(safeUrl)}" alt="${safe(coachName || 'Coach')}" />
  `;
  coachImagePreview.hidden = false;
}

function resetTeamForm() {
  if (localCoachPreviewUrl) {
    URL.revokeObjectURL(localCoachPreviewUrl);
    localCoachPreviewUrl = null;
  }

  teamForm.reset();
  document.getElementById('edit_id').value = '';
  saveTeamButton.textContent = 'Save Team';
  showCoachImagePreview('');
}

function populateFormFromApiTeam(team) {
  resetTeamForm();
  document.getElementById('team_id').value = team.teamId ?? '';
  document.getElementById('abbreviation').value = team.abbreviation ?? '';
  document.getElementById('coach_id').value = team.coachId ?? '';
  document.getElementById('coach_name').value = team.coachName ?? '';
  formMessage.textContent = team.coachName
    ? `NBA podaci za ${team.abbreviation} prebačeni su u formu.`
    : `NBA nije vratio glavnog trenera za ${team.abbreviation}; unesi ga ručno.`;
  teamForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function populateFormFromDbTeam(team) {
  if (localCoachPreviewUrl) {
    URL.revokeObjectURL(localCoachPreviewUrl);
    localCoachPreviewUrl = null;
  }

  document.getElementById('edit_id').value = team.id ?? '';
  document.getElementById('team_id').value = team.team_id ?? '';
  document.getElementById('abbreviation').value = team.abbreviation ?? '';
  document.getElementById('city').value = team.city ?? '';
  document.getElementById('nickname').value = team.nickname ?? '';
  document.getElementById('full_name').value = team.full_name ?? '';
  document.getElementById('conference').value = team.conference ?? '';
  document.getElementById('coach_id').value = team.coach_id ?? '';
  document.getElementById('coach_name').value = team.coach_name ?? '';
  coachImageInput.value = '';
  showCoachImagePreview(team.coach_image_url, team.coach_name);
  saveTeamButton.textContent = 'Update Team';
  formMessage.textContent = `Editing row ID ${team.id}`;
  teamForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderApiTeams(teams) {
  if (!teams.length) {
    apiTeamsTableBody.innerHTML = `
      <tr>
        <td colspan="5">Nema timova.</td>
      </tr>
    `;
    return;
  }

  apiTeamsTableBody.innerHTML = teams.map((team, index) => `
    <tr data-api-index="${index}">
      <td class="api-team-id-cell">${safe(team.teamId)}</td>
      <td class="api-abbreviation-cell">${safe(team.abbreviation)}</td>
      <td>${safe(team.coachId)}</td>
      <td>${safe(team.coachName)}</td>
      <td>
        <button type="button" class="use-api-team-button" data-index="${index}">
          Use in Form
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.use-api-team-button').forEach((button) => {
    button.addEventListener('click', () => {
      const team = apiTeamsData[Number(button.dataset.index)];

      if (team) {
        populateFormFromApiTeam(team);
      }
    });
  });
}

function renderDbTeams(teams) {
  if (!teams.length) {
    dbTeamsTableBody.innerHTML = `
      <tr>
        <td colspan="11">Nema spremljenih timova.</td>
      </tr>
    `;
    return;
  }

  dbTeamsTableBody.innerHTML = teams.map((team, index) => {
    const imageUrl = getSafeImageUrl(team.coach_image_url);

    return `
      <tr data-db-index="${index}">
        <td>${safe(team.id)}</td>
        <td class="db-team-id-cell">${safe(team.team_id)}</td>
        <td class="db-abbreviation-cell">${safe(team.abbreviation)}</td>
        <td>${safe(team.city)}</td>
        <td>${safe(team.nickname)}</td>
        <td>${safe(team.full_name)}</td>
        <td>${safe(team.conference)}</td>
        <td>${safe(team.coach_id)}</td>
        <td>${safe(team.coach_name)}</td>
        <td>
          ${imageUrl
            ? `<img class="coach-image" src="${safe(imageUrl)}" alt="${safe(team.coach_name || 'Coach')}" loading="lazy" />`
            : ''}
        </td>
        <td>
          <button type="button" class="update-team-button" data-id="${safe(team.id)}">
            Update
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.update-team-button').forEach((button) => {
    button.addEventListener('click', () => {
      const team = dbTeamsData.find(
        (item) => String(item.id) === String(button.dataset.id)
      );

      if (team) {
        populateFormFromDbTeam(team);
      }
    });
  });
}

function compareTeams() {
  const apiTeamIds = new Set(
    apiTeamsData.map((team) => normalizeValue(team.teamId))
  );
  const apiAbbreviations = new Set(
    apiTeamsData.map((team) => normalizeValue(team.abbreviation))
  );
  const dbTeamIds = new Set(
    dbTeamsData.map((team) => normalizeValue(team.team_id))
  );
  const dbAbbreviations = new Set(
    dbTeamsData.map((team) => normalizeValue(team.abbreviation))
  );

  apiTeamsTableBody.querySelectorAll('tr[data-api-index]').forEach((row, index) => {
    const team = apiTeamsData[index];
    const teamIdCell = row.querySelector('.api-team-id-cell');
    const abbreviationCell = row.querySelector('.api-abbreviation-cell');
    teamIdCell.classList.toggle(
      'mismatch-cell',
      Boolean(team.teamId) && !dbTeamIds.has(normalizeValue(team.teamId))
    );
    abbreviationCell.classList.toggle(
      'mismatch-cell',
      Boolean(team.abbreviation) &&
        !dbAbbreviations.has(normalizeValue(team.abbreviation))
    );
  });

  dbTeamsTableBody.querySelectorAll('tr[data-db-index]').forEach((row, index) => {
    const team = dbTeamsData[index];
    const teamIdCell = row.querySelector('.db-team-id-cell');
    const abbreviationCell = row.querySelector('.db-abbreviation-cell');
    teamIdCell.classList.toggle(
      'mismatch-cell',
      Boolean(team.team_id) && !apiTeamIds.has(normalizeValue(team.team_id))
    );
    abbreviationCell.classList.toggle(
      'mismatch-cell',
      Boolean(team.abbreviation) &&
        !apiAbbreviations.has(normalizeValue(team.abbreviation))
    );
  });
}

async function uploadCoachImage(teamId, file) {
  const formData = new FormData();
  formData.append('coach_image', file);

  const response = await fetch(`/api/teams/${teamId}/coach-image`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Upload slike nije uspio.');
  }

  return data;
}

teamForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const editId = document.getElementById('edit_id').value;
  const coachIdValue = document.getElementById('coach_id').value;
  const imageFile = coachImageInput.files[0];
  const payload = {
    team_id: Number(document.getElementById('team_id').value) || null,
    abbreviation: document.getElementById('abbreviation').value,
    city: document.getElementById('city').value,
    nickname: document.getElementById('nickname').value,
    full_name: document.getElementById('full_name').value,
    conference: document.getElementById('conference').value,
    coach_id: coachIdValue ? Number(coachIdValue) : null,
    coach_name: document.getElementById('coach_name').value.trim()
  };

  saveTeamButton.disabled = true;

  try {
    const isEditMode = Boolean(editId);
    formMessage.textContent = isEditMode
      ? 'Updating team...'
      : 'Saving team...';

    const response = await fetch(
      isEditMode ? `/api/teams/${editId}` : '/api/teams',
      {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Spremanje nije uspjelo.');
    }

    const savedTeam = data[0];

    if (!savedTeam?.id) {
      throw new Error('Spremljeni Team zapis nije vraćen iz baze.');
    }

    let uploadResult = null;

    if (imageFile) {
      formMessage.textContent = 'Team je spremljen. Uploading coach image...';

      try {
        uploadResult = await uploadCoachImage(savedTeam.id, imageFile);
      } catch (uploadError) {
        document.getElementById('edit_id').value = savedTeam.id;
        saveTeamButton.textContent = 'Update Team';
        await loadDbTeams();
        formMessage.textContent =
          `Team je spremljen, ali slika nije: ${uploadError.message}`;
        return;
      }
    }

    resetTeamForm();
    await loadDbTeams();

    const cleanupWarning = uploadResult?.cleanup_warning;
    formMessage.textContent = cleanupWarning
      ? `Team je spremljen. ${cleanupWarning}`
      : isEditMode ? 'Team ažuriran.' : 'Team spremljen.';
  } catch (error) {
    console.error(error);
    formMessage.textContent = `Greška: ${error.message}`;
  } finally {
    saveTeamButton.disabled = false;
  }
});

coachImageInput.addEventListener('change', () => {
  const file = coachImageInput.files[0];

  if (!file) {
    return;
  }

  if (localCoachPreviewUrl) {
    URL.revokeObjectURL(localCoachPreviewUrl);
  }

  localCoachPreviewUrl = URL.createObjectURL(file);
  showCoachImagePreview(
    localCoachPreviewUrl,
    document.getElementById('coach_name').value,
    { allowBlob: true }
  );
});

async function loadApiTeams() {
  loadTeamsButton.disabled = true;
  apiTeamsMessage.textContent = 'Loading active NBA teams and coaches...';

  try {
    const response = await fetch('/api/teams');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Dohvaćanje NBA timova nije uspjelo.');
    }

    apiTeamsData = Array.isArray(data.teams) ? data.teams : [];
    renderApiTeams(apiTeamsData);
    compareTeams();

    const coachesFound = apiTeamsData.filter((team) => team.coachId).length;
    apiTeamsMessage.textContent =
      `Loaded ${apiTeamsData.length} teams for ${data.season}; ` +
      `head coaches found: ${coachesFound}.` +
      (data.warnings?.length ? ` Warnings: ${data.warnings.length}.` : '');
  } catch (error) {
    console.error(error);
    apiTeamsMessage.textContent = `Greška: ${error.message}`;
  } finally {
    loadTeamsButton.disabled = false;
  }
}

async function loadDbTeams() {
  loadDbTeamsButton.disabled = true;

  try {
    const response = await fetch('/api/teams/db');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Dohvaćanje DB timova nije uspjelo.');
    }

    dbTeamsData = data;
    renderDbTeams(dbTeamsData);
    compareTeams();
  } catch (error) {
    console.error(error);
    formMessage.textContent = `Greška: ${error.message}`;
  } finally {
    loadDbTeamsButton.disabled = false;
  }
}

loadTeamsButton.addEventListener('click', loadApiTeams);
loadDbTeamsButton.addEventListener('click', loadDbTeams);

loadDbTeams();
