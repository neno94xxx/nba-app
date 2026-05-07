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

module.exports = {
  insertGame,
  getAllGames,
  deleteGame
};