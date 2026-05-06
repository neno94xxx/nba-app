const supabase = require('./client');

async function insertPlayerTeamHistory(historyData) {
  const { data, error } = await supabase
    .from('PlayerTeamHistory')
    .insert([historyData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function deletePlayerTeamHistory(playerId) {
  const { error } = await supabase
    .from('PlayerTeamHistory')
    .delete()
    .eq('player_id', playerId);

  if (error) {
    throw new Error(error.message);
  }
}

async function getPlayerTeamHistory(playerId) {
  const { data, error } = await supabase
    .from('PlayerTeamHistory')
    .select('*')
    .eq('player_id', playerId)
    .order('first_game_date_with_new_team', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  insertPlayerTeamHistory,
  deletePlayerTeamHistory,
  getPlayerTeamHistory
};