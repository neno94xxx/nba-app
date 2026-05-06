

async function fetchPlayerGameLog(playerId, season) {
  const url = `https://stats.nba.com/stats/playergamelog?PlayerID=${playerId}&Season=${season}&SeasonType=Regular Season`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Referer: 'https://www.nba.com/',
      Origin: 'https://www.nba.com',
      Accept: 'application/json, text/plain, */*'
    }
  });

  return response.json();
}

module.exports = { fetchPlayerGameLog };