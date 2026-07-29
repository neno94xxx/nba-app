const supabase = require('./client');

async function deletePlayerCareerStats(playerId) {
  const { error: seasonError } = await supabase
    .from('player_season_totals')
    .delete()
    .eq('player_id', playerId);

  if (seasonError) {
    throw new Error(seasonError.message);
  }

  const { error: careerError } = await supabase
    .from('player_career_totals')
    .delete()
    .eq('player_id', playerId);

  if (careerError) {
    throw new Error(careerError.message);
  }
}

async function insertPlayerSeasonTotals(rows) {
  if (!rows.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_season_totals')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function insertPlayerCareerTotals(rows) {
  if (!rows.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_career_totals')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  deletePlayerCareerStats,
  insertPlayerSeasonTotals,
  insertPlayerCareerTotals
};