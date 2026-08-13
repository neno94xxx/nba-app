const supabase = require('./client');
const {
  aggregatePlayerGameStats
} = require('../services/playerGameStatsSummary');

function normalizeId(value) {
  return String(value).trim();
}

async function getStoredPlayerIds(gameId) {
  const { data, error } = await supabase
    .from('player_game_stats')
    .select('player_id')
    .eq('game_id', gameId);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(data.map((row) => normalizeId(row.player_id)));
}

function getNameSearchTokens(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[,.*()%_]/g, ''))
    .filter(Boolean);
}

async function getPlayerGameStatsRows(playerIds) {
  const pageSize = 1000;
  let from = 0;
  let rows = [];

  while (true) {
    const { data, error } = await supabase
      .from('player_game_stats')
      .select(
        'game_id,player_id,start_position,min,fgm,fga,fg3m,fg3a,' +
        'ftm,fta,oreb,dreb,reb,ast,stl,blk,turnovers,pf,pts,plus_minus'
      )
      .in('player_id', playerIds)
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows = rows.concat(data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function getPlayerGameStatsSummariesByName(name) {
  const tokens = getNameSearchTokens(name);

  if (!tokens.length) {
    throw new Error('Upiši barem jedan dio imena igrača.');
  }

  let query = supabase
    .from('Player')
    .select('player_id,first_name,last_name,team_abbreviation')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .limit(20);

  tokens.forEach((token) => {
    query = query.or(
      `first_name.ilike.%${token}%,last_name.ilike.%${token}%`
    );
  });

  const { data: players, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!players.length) {
    return [];
  }

  const rows = await getPlayerGameStatsRows(
    players.map((player) => player.player_id)
  );

  return aggregatePlayerGameStats(players, rows);
}

async function savePlayerGameStats(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error('Nema player game stats redaka za spremanje.');
  }

  const gameId = normalizeId(rows[0].game_id);
  const uniqueRows = Array.from(new Map(
    rows.map((row) => [`${normalizeId(row.game_id)}:${normalizeId(row.player_id)}`, row])
  ).values());

  if (uniqueRows.some((row) => normalizeId(row.game_id) !== gameId)) {
    throw new Error('Svi player game stats redci moraju pripadati istoj utakmici.');
  }

  const storedBefore = await getStoredPlayerIds(gameId);
  const missingRows = uniqueRows.filter(
    (row) => !storedBefore.has(normalizeId(row.player_id))
  );

  let inserted = [];

  if (missingRows.length) {
    const { data, error } = await supabase
      .from('player_game_stats')
      .insert(missingRows)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    inserted = data;
  }

  const storedAfter = await getStoredPlayerIds(gameId);
  const missingAfterSave = uniqueRows.filter(
    (row) => !storedAfter.has(normalizeId(row.player_id))
  );

  if (missingAfterSave.length) {
    throw new Error(
      `${missingAfterSave.length} od ${uniqueRows.length} redaka nije spremljeno.`
    );
  }

  return {
    gameId,
    expected: uniqueRows.length,
    inserted: inserted.length,
    alreadyStored: uniqueRows.length - missingRows.length,
    stored: uniqueRows.length
  };
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
  savePlayerGameStats,
  getImportedPlayerGameStatsGameIds,
  getPlayerGameStatsSummariesByName
};
