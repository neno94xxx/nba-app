async function fetchPlayersBySeason(season, isOnlyCurrentSeason = '0') {
  const url =
    `https://stats.nba.com/stats/commonallplayers` +
    `?LeagueID=00&Season=${season}&IsOnlyCurrentSeason=${isOnlyCurrentSeason}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.nba.com/',
      'Origin': 'https://www.nba.com',
      'Accept': 'application/json, text/plain, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`NBA API vratio status ${response.status}`);
  }

  return response.json();
}

module.exports = {
  fetchPlayersBySeason
};