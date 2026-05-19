const conferenceSelect = document.getElementById('conferenceSelect');
const loadTeamsButton = document.getElementById('loadTeamsButton');
const loadFeaturedTeamsButton = document.getElementById('loadFeaturedTeamsButton');

const playerTeamSelect = document.getElementById('playerTeamSelect');
const loadPlayersButton = document.getElementById('loadPlayersButton');
const loadFeaturedPlayersButton = document.getElementById('loadFeaturedPlayersButton');

const statusMessage = document.getElementById('statusMessage');

const teamsTableBody = document.getElementById('teamsTableBody');
const featuredTeamsTableBody = document.getElementById('featuredTeamsTableBody');

const playersTableBody = document.getElementById('playersTableBody');
const featuredPlayersTableBody = document.getElementById('featuredPlayersTableBody');

let teamsData = [];
let featuredTeamsData = [];

let playersData = [];
let featuredPlayersData = [];

let teamOptions = [];

function safe(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return value;
}

function buildPlayerName(player) {
  return `${player.first_name || ''} ${player.last_name || ''}`.trim();
}

function getNextTeamSortOrder() {
  if (!featuredTeamsData.length) {
    return 1;
  }

  const maxSortOrder = Math.max(
    ...featuredTeamsData.map((team) => Number(team.sort_order || 0))
  );

  return maxSortOrder + 1;
}

function getNextPlayerSortOrder() {
  if (!featuredPlayersData.length) {
    return 1;
  }

  const maxSortOrder = Math.max(
    ...featuredPlayersData.map((player) => Number(player.sort_order || 0))
  );

  return maxSortOrder + 1;
}

function isTeamAlreadyFeaturedTable(teamId) {
  return featuredTeamsData.some(
    (team) => String(team.team_id) === String(teamId)
  );
}

function isPlayerAlreadyFeaturedTable(playerId) {
  return featuredPlayersData.some(
    (player) => String(player.player_id) === String(playerId)
  );
}

function renderTeams() {
  if (!teamsData.length) {
    teamsTableBody.innerHTML = `
      <tr>
        <td colspan="4">Nema timova za odabrani filter.</td>
      </tr>
    `;
    return;
  }

  teamsTableBody.innerHTML = teamsData.map((team, index) => {
    const alreadyAdded = isTeamAlreadyFeaturedTable(team.team_id);

    return `
      <tr>
        <td>${safe(team.conference)}</td>
        <td>${safe(team.team_id)}</td>
        <td>${safe(team.full_name)}</td>
        <td>
          <button
            class="add-featured-team-button"
            data-index="${index}"
            type="button"
            ${alreadyAdded ? 'disabled' : ''}
          >
            ${alreadyAdded ? 'Added' : 'Add to Featured'}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  attachAddFeaturedTeamEvents();
}

function renderFeaturedTeams() {
  if (!featuredTeamsData.length) {
    featuredTeamsTableBody.innerHTML = `
      <tr>
        <td colspan="9">Nema featured timova.</td>
      </tr>
    `;
    return;
  }

  featuredTeamsTableBody.innerHTML = featuredTeamsData.map((team) => `
    <tr class="${team.featured ? 'featured-row' : ''}">
      <td>${safe(team.team_id)}</td>
      <td>${safe(team.team_name)}</td>

      <td>
        ${
          team.logo_url
            ? `<img
                src="${team.logo_url}"
                alt="Team logo"
                class="team-logo"
              />`
            : ''
        }
      </td>

      <td>
        <input
          class="featured-team-checkbox"
          type="checkbox"
          data-team-id="${team.team_id}"
          ${team.featured ? 'checked' : ''}
        />
      </td>

      <td>${safe(team.sort_order)}</td>
      <td>${safe(team.created_at)}</td>
      <td>${safe(team.updated_at)}</td>

      <td>
        <input
          class="team-logo-input"
          type="file"
          accept="image/*"
          data-team-id="${team.team_id}"
        />
      </td>

      <td>
        <button
          class="delete-featured-team-button delete-button"
          type="button"
          data-team-id="${team.team_id}"
        >
          Delete
        </button>
      </td>
    </tr>
  `).join('');

  attachFeaturedTeamCheckboxEvents();
  attachTeamLogoUploadEvents();
  attachDeleteFeaturedTeamEvents();
}

function renderPlayers() {
  if (!playersData.length) {
    playersTableBody.innerHTML = `
      <tr>
        <td colspan="4">Nema igrača za odabrani filter.</td>
      </tr>
    `;
    return;
  }

  playersTableBody.innerHTML = playersData.map((player, index) => {
    const alreadyAdded = isPlayerAlreadyFeaturedTable(player.player_id);

    return `
      <tr>
        <td>${safe(player.team_abbreviation)}</td>
        <td>${safe(player.player_id)}</td>
        <td>${safe(buildPlayerName(player))}</td>
        <td>
          <button
            class="add-featured-player-button"
            data-index="${index}"
            type="button"
            ${alreadyAdded ? 'disabled' : ''}
          >
            ${alreadyAdded ? 'Added' : 'Add to Featured'}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  attachAddFeaturedPlayerEvents();
}

function renderFeaturedPlayers() {
  if (!featuredPlayersData.length) {
    featuredPlayersTableBody.innerHTML = `
      <tr>
        <td colspan="10">Nema featured igrača.</td>
      </tr>
    `;
    return;
  }

  featuredPlayersTableBody.innerHTML = featuredPlayersData.map((player) => `
    <tr class="${player.featured ? 'featured-row' : ''}">
      <td>${safe(player.player_id)}</td>
      <td>${safe(player.player_name)}</td>
      <td>${safe(player.team_abbreviation)}</td>

      <td>
        ${
          player.image_url
            ? `<img
                src="${player.image_url}"
                alt="Player image"
                class="player-image"
              />`
            : ''
        }
      </td>

      <td>
        <input
          class="featured-player-checkbox"
          type="checkbox"
          data-player-id="${player.player_id}"
          ${player.featured ? 'checked' : ''}
        />
      </td>

      <td>${safe(player.sort_order)}</td>
      <td>${safe(player.created_at)}</td>
      <td>${safe(player.updated_at)}</td>

      <td>
        <input
          class="player-image-input"
          type="file"
          accept="image/*"
          data-player-id="${player.player_id}"
        />
      </td>

      <td>
        <button
          class="delete-featured-player-button delete-button"
          type="button"
          data-player-id="${player.player_id}"
        >
          Delete
        </button>
      </td>
    </tr>
  `).join('');

  attachFeaturedPlayerCheckboxEvents();
  attachPlayerImageUploadEvents();
  attachDeleteFeaturedPlayerEvents();
}

function attachAddFeaturedTeamEvents() {
  document.querySelectorAll('.add-featured-team-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = Number(button.dataset.index);
      const team = teamsData[index];

      if (!team) {
        statusMessage.textContent = 'Tim nije pronađen.';
        return;
      }

      await addFeaturedTeam(team);
    });
  });
}

function attachAddFeaturedPlayerEvents() {
  document.querySelectorAll('.add-featured-player-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = Number(button.dataset.index);
      const player = playersData[index];

      if (!player) {
        statusMessage.textContent = 'Igrač nije pronađen.';
        return;
      }

      await addFeaturedPlayer(player);
    });
  });
}

function attachFeaturedTeamCheckboxEvents() {
  document.querySelectorAll('.featured-team-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', async () => {
      const teamId = checkbox.dataset.teamId;
      const featured = checkbox.checked;

      await updateFeaturedTeam(teamId, featured);
    });
  });
}

function attachFeaturedPlayerCheckboxEvents() {
  document.querySelectorAll('.featured-player-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', async () => {
      const playerId = checkbox.dataset.playerId;
      const featured = checkbox.checked;

      await updateFeaturedPlayer(playerId, featured);
    });
  });
}

function attachTeamLogoUploadEvents() {
  document.querySelectorAll('.team-logo-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const teamId = input.dataset.teamId;
      const file = input.files[0];

      if (!file) {
        return;
      }

      await uploadTeamLogo(teamId, file);
    });
  });
}

function attachPlayerImageUploadEvents() {
  document.querySelectorAll('.player-image-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const playerId = input.dataset.playerId;
      const file = input.files[0];

      if (!file) {
        return;
      }

      await uploadPlayerImage(playerId, file);
    });
  });
}

function attachDeleteFeaturedTeamEvents() {
  document.querySelectorAll('.delete-featured-team-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const teamId = button.dataset.teamId;

      if (!teamId) {
        statusMessage.textContent = 'Team ID nije pronađen.';
        return;
      }

      const confirmed = confirm(
        `Obrisati featured team ${teamId} i njegov logo iz storage-a?`
      );

      if (!confirmed) {
        return;
      }

      await deleteFeaturedTeam(teamId);
    });
  });
}

function attachDeleteFeaturedPlayerEvents() {
  document.querySelectorAll('.delete-featured-player-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const playerId = button.dataset.playerId;

      if (!playerId) {
        statusMessage.textContent = 'Player ID nije pronađen.';
        return;
      }

      const confirmed = confirm(
        `Obrisati featured player ${playerId} i njegovu sliku iz storage-a?`
      );

      if (!confirmed) {
        return;
      }

      await deleteFeaturedPlayer(playerId);
    });
  });
}

async function loadTeamOptions() {
  try {
    const response = await fetch('/api/featured/team-options');
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja timova za dropdown.';
      return;
    }

    teamOptions = data;

    playerTeamSelect.innerHTML = `
      <option value="">All</option>
      ${teamOptions.map((team) => `
        <option value="${team.team_id}">
          ${team.full_name} (${team.abbreviation || ''})
        </option>
      `).join('')}
    `;
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      'Dogodila se greška kod dohvaćanja timova za dropdown.';
  }
}

async function loadTeams() {
  const conference = conferenceSelect.value;

  const params = new URLSearchParams();

  if (conference) {
    params.append('conference', conference);
  }

  statusMessage.textContent = 'Loading teams...';

  try {
    await loadFeaturedTeams(false);

    const response = await fetch(`/api/featured/teams?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja timova.';
      return;
    }

    teamsData = data;

    renderTeams();

    statusMessage.textContent = `Loaded ${teamsData.length} teams.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Dogodila se greška kod dohvaćanja timova.';
  }
}

async function loadPlayers() {
  const teamId = playerTeamSelect.value;

  const params = new URLSearchParams();

  if (teamId) {
    params.append('teamId', teamId);
  }

  statusMessage.textContent = 'Loading players...';

  try {
    await loadFeaturedPlayers(false);

    const response = await fetch(`/api/featured/players?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja igrača.';
      return;
    }

    playersData = data;

    renderPlayers();

    statusMessage.textContent = `Loaded ${playersData.length} players.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Dogodila se greška kod dohvaćanja igrača.';
  }
}

async function loadFeaturedTeams(showStatus = true) {
  if (showStatus) {
    statusMessage.textContent = 'Loading featured teams...';
  }

  try {
    const response = await fetch('/api/featured/featured-teams');
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja featured timova.';
      return;
    }

    featuredTeamsData = data;

    renderFeaturedTeams();

    if (teamsData.length) {
      renderTeams();
    }

    if (showStatus) {
      statusMessage.textContent =
        `Loaded ${featuredTeamsData.length} featured teams.`;
    }
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      'Dogodila se greška kod dohvaćanja featured timova.';
  }
}

async function loadFeaturedPlayers(showStatus = true) {
  if (showStatus) {
    statusMessage.textContent = 'Loading featured players...';
  }

  try {
    const response = await fetch('/api/featured/featured-players');
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent = 'Greška kod dohvaćanja featured igrača.';
      return;
    }

    featuredPlayersData = data;

    renderFeaturedPlayers();

    if (playersData.length) {
      renderPlayers();
    }

    if (showStatus) {
      statusMessage.textContent =
        `Loaded ${featuredPlayersData.length} featured players.`;
    }
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      'Dogodila se greška kod dohvaćanja featured igrača.';
  }
}

async function addFeaturedTeam(team) {
  try {
    const sortOrder = getNextTeamSortOrder();

    statusMessage.textContent =
      `Adding team ${team.team_id} to featured...`;

    const response = await fetch('/api/featured/featured-teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team_id: team.team_id,
        logo_url: null,
        featured: true,
        sort_order: sortOrder
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod dodavanja featured tima: ${data.error}`;
      return;
    }

    console.log('FEATURED TEAM INSERT:', data);

    await loadFeaturedTeams(false);

    statusMessage.textContent =
      `Team ${team.team_id} added to featured.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      'Dogodila se greška kod dodavanja featured tima.';
  }
}

async function addFeaturedPlayer(player) {
  try {
    const sortOrder = getNextPlayerSortOrder();

    statusMessage.textContent =
      `Adding player ${player.player_id} to featured...`;

    const response = await fetch('/api/featured/featured-players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        player_id: player.player_id,
        image_url: null,
        featured: true,
        sort_order: sortOrder
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod dodavanja featured igrača: ${data.error}`;
      return;
    }

    console.log('FEATURED PLAYER INSERT:', data);

    await loadFeaturedPlayers(false);

    statusMessage.textContent =
      `Player ${player.player_id} added to featured.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      'Dogodila se greška kod dodavanja featured igrača.';
  }
}

async function updateFeaturedTeam(teamId, featured) {
  try {
    statusMessage.textContent =
      `Updating featured status for team ${teamId}...`;

    const response = await fetch(
      `/api/featured/featured-teams/${teamId}/featured`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featured
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod updatea featured statusa: ${data.error}`;
      return;
    }

    console.log('FEATURED TEAM UPDATE:', data);

    await loadFeaturedTeams(false);

    statusMessage.textContent =
      `Updated featured status for team ${teamId}.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      'Dogodila se greška kod updatea featured statusa.';
  }
}

async function updateFeaturedPlayer(playerId, featured) {
  try {
    statusMessage.textContent =
      `Updating featured status for player ${playerId}...`;

    const response = await fetch(
      `/api/featured/featured-players/${playerId}/featured`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featured
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod updatea featured statusa: ${data.error}`;
      return;
    }

    console.log('FEATURED PLAYER UPDATE:', data);

    await loadFeaturedPlayers(false);

    statusMessage.textContent =
      `Updated featured status for player ${playerId}.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      'Dogodila se greška kod updatea featured statusa igrača.';
  }
}

async function uploadTeamLogo(teamId, file) {
  try {
    statusMessage.textContent =
      `Uploading logo for team ${teamId}...`;

    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(
      `/api/featured/featured-teams/${teamId}/logo`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod uploada loga: ${data.error}`;
      return;
    }

    console.log('TEAM LOGO UPLOAD:', data);

    await loadFeaturedTeams(false);

    statusMessage.textContent =
      `Logo uploaded for team ${teamId}.`;
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      'Dogodila se greška kod uploada loga.';
  }
}

async function uploadPlayerImage(playerId, file) {
  try {
    statusMessage.textContent =
      `Uploading image for player ${playerId}...`;

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `/api/featured/featured-players/${playerId}/image`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod uploada slike igrača: ${data.error}`;
      return;
    }

    console.log('PLAYER IMAGE UPLOAD:', data);

    await loadFeaturedPlayers(false);

    statusMessage.textContent =
      `Image uploaded for player ${playerId}.`;
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      'Dogodila se greška kod uploada slike igrača.';
  }
}

async function deleteFeaturedTeam(teamId) {
  try {
    statusMessage.textContent =
      `Deleting featured team ${teamId}...`;

    const response = await fetch(
      `/api/featured/featured-teams/${teamId}`,
      {
        method: 'DELETE'
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod brisanja featured tima: ${data.error}`;
      return;
    }

    console.log('FEATURED TEAM DELETE:', data);

    await loadFeaturedTeams(false);

    if (teamsData.length) {
      renderTeams();
    }

    statusMessage.textContent =
      `Featured team ${teamId} deleted.`;
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      'Dogodila se greška kod brisanja featured tima.';
  }
}

async function deleteFeaturedPlayer(playerId) {
  try {
    statusMessage.textContent =
      `Deleting featured player ${playerId}...`;

    const response = await fetch(
      `/api/featured/featured-players/${playerId}`,
      {
        method: 'DELETE'
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      statusMessage.textContent =
        `Greška kod brisanja featured igrača: ${data.error}`;
      return;
    }

    console.log('FEATURED PLAYER DELETE:', data);

    await loadFeaturedPlayers(false);

    if (playersData.length) {
      renderPlayers();
    }

    statusMessage.textContent =
      `Featured player ${playerId} deleted.`;
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      'Dogodila se greška kod brisanja featured igrača.';
  }
}

loadTeamsButton.addEventListener('click', loadTeams);
loadFeaturedTeamsButton.addEventListener('click', () => loadFeaturedTeams(true));

loadPlayersButton.addEventListener('click', loadPlayers);
loadFeaturedPlayersButton.addEventListener('click', () => loadFeaturedPlayers(true));

loadTeamOptions();
loadFeaturedTeams(false);
loadFeaturedPlayers(false);