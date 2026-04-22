const supabase = require('./client');

async function insertPlayer(playerData) {
  const { data, error } = await supabase
    .from('Player')
    .insert([playerData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAllPlayers() {
  const { data, error } = await supabase
    .from('Player')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updatePlayer(id, playerData) {
  const { data, error } = await supabase
    .from('Player')
    .update(playerData)
    .eq('id', id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  insertPlayer,
  getAllPlayers,
  updatePlayer
};