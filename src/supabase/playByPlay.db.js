const supabase = require('./client');

async function insertLineupTimeline(rows) {
  const { data, error } = await supabase
    .from('lineup_timeline')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}



async function insertPlayByPlay(rows) {
  const { data, error } = await supabase
    .from('play_by_play')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  insertLineupTimeline,
  insertPlayByPlay
};