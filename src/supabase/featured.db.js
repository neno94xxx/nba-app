const supabase = require('./client');

async function getTeamsForFeatured({ conference }) {
  let query = supabase
    .from('Team')
    .select('team_id, full_name, conference')
    .order('conference', { ascending: true })
    .order('full_name', { ascending: true });

  if (conference) {
    query = query.eq('conference', conference);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAllTeamsForDropdown() {
  const { data, error } = await supabase
    .from('Team')
    .select('team_id, full_name, abbreviation')
    .order('full_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getPlayersForFeatured({ teamId }) {
  let query = supabase
    .from('Player')
    .select('player_id, first_name, last_name, team_id, team_abbreviation')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (teamId) {
    query = query.eq('team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getFeaturedTeams() {
  const { data: featuredTeams, error: featuredError } = await supabase
    .from('featured_team')
    .select('*')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });

  if (featuredError) {
    throw new Error(featuredError.message);
  }

  if (!featuredTeams.length) {
    return [];
  }

  const teamIds = featuredTeams.map((team) => team.team_id);

  const { data: teams, error: teamsError } = await supabase
    .from('Team')
    .select('team_id, full_name')
    .in('team_id', teamIds);

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const teamsMap = new Map(
    teams.map((team) => [
      String(team.team_id),
      team.full_name
    ])
  );

  return featuredTeams.map((team) => ({
    ...team,
    team_name: teamsMap.get(String(team.team_id)) || ''
  }));
}

async function getFeaturedPlayers() {
  const { data: featuredPlayers, error: featuredError } = await supabase
    .from('featured_player')
    .select('*')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });

  if (featuredError) {
    throw new Error(featuredError.message);
  }

  if (!featuredPlayers.length) {
    return [];
  }

  const playerIds = featuredPlayers.map((player) => player.player_id);

  const { data: players, error: playersError } = await supabase
    .from('Player')
    .select('player_id, first_name, last_name, team_id, team_abbreviation')
    .in('player_id', playerIds);

  if (playersError) {
    throw new Error(playersError.message);
  }

  const playersMap = new Map(
    players.map((player) => [
      String(player.player_id),
      player
    ])
  );

  return featuredPlayers.map((featuredPlayer) => {
    const player = playersMap.get(String(featuredPlayer.player_id));

    return {
      ...featuredPlayer,
      player_name: player
        ? `${player.first_name || ''} ${player.last_name || ''}`.trim()
        : '',
      team_id: player?.team_id || null,
      team_abbreviation: player?.team_abbreviation || ''
    };
  });
}

async function insertFeaturedTeam(teamData) {
  const { data, error } = await supabase
    .from('featured_team')
    .insert([teamData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function insertFeaturedPlayer(playerData) {
  const { data, error } = await supabase
    .from('featured_player')
    .insert([playerData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateFeaturedTeamFeatured(teamId, featured) {
  const { data, error } = await supabase
    .from('featured_team')
    .update({ featured })
    .eq('team_id', teamId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateFeaturedPlayerFeatured(playerId, featured) {
  const { data, error } = await supabase
    .from('featured_player')
    .update({ featured })
    .eq('player_id', playerId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function uploadTeamLogo(teamId, file) {
  const fileExtension = file.originalname.split('.').pop();
  const filePath = `${teamId}.${fileExtension}`;

  const { error: uploadError } = await supabase
    .storage
    .from('team-logos')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase
    .storage
    .from('team-logos')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function uploadPlayerImage(playerId, file) {
  const fileExtension = file.originalname.split('.').pop();
  const filePath = `${playerId}.${fileExtension}`;

  const { error: uploadError } = await supabase
    .storage
    .from('player-avatars')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase
    .storage
    .from('player-avatars')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function updateFeaturedTeamLogo(teamId, logoUrl) {
  const { data, error } = await supabase
    .from('featured_team')
    .update({
      logo_url: logoUrl
    })
    .eq('team_id', teamId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateFeaturedPlayerImage(playerId, imageUrl) {
  const { data, error } = await supabase
    .from('featured_player')
    .update({
      image_url: imageUrl
    })
    .eq('player_id', playerId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function extractStoragePathFromPublicUrl(publicUrl, bucketName) {
  if (!publicUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return publicUrl.substring(markerIndex + marker.length);
}

async function deleteFeaturedTeam(teamId) {
  const { data: existingRows, error: selectError } = await supabase
    .from('featured_team')
    .select('team_id, logo_url')
    .eq('team_id', teamId);

  if (selectError) {
    throw new Error(selectError.message);
  }

  const existingRow = existingRows?.[0];

  if (!existingRow) {
    throw new Error('Featured team nije pronađen.');
  }

  const logoPath = extractStoragePathFromPublicUrl(
    existingRow.logo_url,
    'team-logos'
  );

  if (logoPath) {
    const { error: storageError } = await supabase
      .storage
      .from('team-logos')
      .remove([logoPath]);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { data, error } = await supabase
    .from('featured_team')
    .delete()
    .eq('team_id', teamId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function deleteFeaturedPlayer(playerId) {
  const { data: existingRows, error: selectError } = await supabase
    .from('featured_player')
    .select('player_id, image_url')
    .eq('player_id', playerId);

  if (selectError) {
    throw new Error(selectError.message);
  }

  const existingRow = existingRows?.[0];

  if (!existingRow) {
    throw new Error('Featured player nije pronađen.');
  }

  const imagePath = extractStoragePathFromPublicUrl(
    existingRow.image_url,
    'player-avatars'
  );

  if (imagePath) {
    const { error: storageError } = await supabase
      .storage
      .from('player-avatars')
      .remove([imagePath]);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { data, error } = await supabase
    .from('featured_player')
    .delete()
    .eq('player_id', playerId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  getTeamsForFeatured,
  getAllTeamsForDropdown,
  getPlayersForFeatured,

  getFeaturedTeams,
  getFeaturedPlayers,

  insertFeaturedTeam,
  insertFeaturedPlayer,

  updateFeaturedTeamFeatured,
  updateFeaturedPlayerFeatured,

  uploadTeamLogo,
  uploadPlayerImage,

  updateFeaturedTeamLogo,
  updateFeaturedPlayerImage,

  deleteFeaturedTeam,
  deleteFeaturedPlayer
};