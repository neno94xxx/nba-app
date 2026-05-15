async function fetchPlayByPlay(gameId) {
  const url =
    `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`;

  console.log('PLAY BY PLAY URL:', url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.nba.com/',
      'Origin': 'https://www.nba.com'
    }
  });

  if (!response.ok) {
    const text = await response.text();

    console.error('NBA CDN error status:', response.status);
    console.error('NBA CDN error body:', text);

    throw new Error(`NBA CDN vratio status ${response.status}`);
  }

  return response.json();
}

module.exports = {
  fetchPlayByPlay
};