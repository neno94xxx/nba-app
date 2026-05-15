const supabase = require('./client');

async function insertGame(gameData) {
  const { data, error } = await supabase
    .from('Game')
    .insert([gameData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAllGames() {
  const pageSize = 1000;
  let from = 0;
  let allGames = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('Game')
      .select('*')
      .order('game_date', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    allGames = allGames.concat(data);

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allGames;
}

async function deleteGame(id) {
  const { data, error } = await supabase
    .from('Game')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getGamesByFilters({
  gameType,
  dateFrom,
  dateTo,
  team
}) {
  let query = supabase
    .from('Game')
    .select('*')
    .order('game_date', { ascending: true });

  if (gameType) {
    query = query.eq('game_type', gameType);
  }

  if (dateFrom) {
    query = query.gte('game_date', dateFrom);
  }

  if (dateTo) {
    query = query.lte('game_date', dateTo);
  }

  if (team) {
    const normalizedTeam = String(team).trim().toUpperCase();

    query = query.or(
      `team_a_abbreviation.eq.${normalizedTeam},team_b_abbreviation.eq.${normalizedTeam}`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  insertGame,
  getAllGames,
  deleteGame,
  getGamesByFilters
};