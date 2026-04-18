const supabase = require('./client');

async function insertTeam(teamData) {
  const { data, error } = await supabase
    .from('Team')
    .insert([teamData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


async function getAllTeams() {
  const { data, error } = await supabase
    .from('Team')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateTeam(id, teamData) {
  const { data, error } = await supabase
    .from('Team')
    .update(teamData)
    .eq('id', id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  insertTeam,
  getAllTeams,
  updateTeam
};
