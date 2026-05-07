function formatDateForNba(date) {
  if (!date) return '';

  const [year, month, day] = date.split('-');

  if (!year || !month || !day) {
    return date;
  }

  return `${month}/${day}/${year}`;
}

async function fetchLeagueGames({
  season = '2024-25',
  seasonType = 'Regular Season',
  dateFrom = '',
  dateTo = ''
}) {
  const params = new URLSearchParams({
    LeagueID: '00',
    PlayerOrTeam: 'T',
    Season: season,
    SeasonType: seasonType
  });

  if (dateFrom) {
    params.append('DateFrom', formatDateForNba(dateFrom));
  }

  if (dateTo) {
    params.append('DateTo', formatDateForNba(dateTo));
  }

  const url = `https://stats.nba.com/stats/leaguegamefinder?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Referer: 'https://www.nba.com/',
      Origin: 'https://www.nba.com',
      Accept: 'application/json, text/plain, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`NBA API vratio status ${response.status}`);
  }

  return response.json();
}

module.exports = {
  fetchLeagueGames
};