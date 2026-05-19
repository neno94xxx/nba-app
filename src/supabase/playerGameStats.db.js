const supabase = require('./client');

async function insertPlayerGameStats(rows) {
  const { data, error } = await supabase
    .from('player_game_stats')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getImportedPlayerGameStatsGameIds() {
  const pageSize = 1000;
  let from = 0;
  const gameIds = new Set();

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('player_game_stats')
      .select('game_id')
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    data.forEach((row) => {
      if (row.game_id) {
        gameIds.add(row.game_id);
      }
    });

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return Array.from(gameIds);
}

module.exports = {
  insertPlayerGameStats,
  getImportedPlayerGameStatsGameIds
};