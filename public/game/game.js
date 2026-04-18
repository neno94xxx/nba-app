const loadGamesButton = document.getElementById('loadGamesButton');
const gameDateInput = document.getElementById('gameDate');
const gamesResult = document.getElementById('gamesResult');

function renderGames(gameRows) {
  if (!gameRows.length) {
    gamesResult.innerHTML = '<p>Nema utakmica za odabrani datum.</p>';
    return;
  }

  const html = gameRows.map((game) => {
    return `
      <div class="game-card">
        <p><strong>Game ID:</strong> ${game.gameId}</p>
        <p><strong>Home Team ID:</strong> ${game.homeTeamId}</p>
        <p><strong>Visitor Team ID:</strong> ${game.visitorTeamId}</p>
        <p><strong>Status:</strong> ${game.statusText}</p>
      </div>
    `;
  }).join('');

  gamesResult.innerHTML = html;
}

loadGamesButton.addEventListener('click', async () => {
  const date = gameDateInput.value;

  if (!date) {
    alert('Odaberi datum.');
    return;
  }

  try {
    const response = await fetch(`/api/games/by-date?date=${date}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert('Greška kod dohvaćanja utakmica.');
      return;
    }

    console.log('Games response:');
    console.log(data);

    const gameHeader = data.resultSets.find(
      (resultSet) => resultSet.name === 'GameHeader'
    );

    if (!gameHeader || !Array.isArray(gameHeader.rowSet)) {
      gamesResult.innerHTML = '<p>Nema GameHeader podataka.</p>';
      return;
    }

    const games = gameHeader.rowSet.map((row) => ({
      gameId: row[2],
      statusText: row[4],
      homeTeamId: row[6],
      visitorTeamId: row[7]
    }));

    renderGames(games);
  } catch (error) {
    console.error(error);
    alert('Dogodila se greška.');
  }
});