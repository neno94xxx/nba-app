const supabase = require('./client');
const { randomUUID } = require('crypto');
const getSupabaseAdmin = require('./adminClient');

const COACH_IMAGES_BUCKET = 'coach-images';

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

function getImageExtension(file) {
  const extensionsByMimeType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  const extension = extensionsByMimeType[file.mimetype];

  if (!extension) {
    throw new Error('Podržane su JPG, PNG, WEBP i GIF slike.');
  }

  return extension;
}

function extractStoragePath(publicUrl) {
  if (!publicUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${COACH_IMAGES_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(
    publicUrl
      .substring(markerIndex + marker.length)
      .split(/[?#]/)[0]
  );
}

async function removeCoachImage(supabaseAdmin, filePath) {
  if (!filePath) {
    return;
  }

  const { error } = await supabaseAdmin.storage
    .from(COACH_IMAGES_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(error.message);
  }
}

async function replaceTeamCoachImage(id, file) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: existingRows, error: selectError } = await supabaseAdmin
    .from('Team')
    .select('id,team_id,coach_image_url')
    .eq('id', id);

  if (selectError) {
    throw new Error(selectError.message);
  }

  const existingTeam = existingRows?.[0];

  if (!existingTeam) {
    throw new Error('Team nije pronađen.');
  }

  const extension = getImageExtension(file);
  const ownerId = existingTeam.team_id || existingTeam.id;
  const newFilePath =
    `${ownerId}/${Date.now()}-${randomUUID()}.${extension}`;
  const oldFilePath = extractStoragePath(existingTeam.coach_image_url);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(COACH_IMAGES_BUCKET)
    .upload(newFilePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(COACH_IMAGES_BUCKET)
    .getPublicUrl(newFilePath);
  const publicUrl = publicUrlData.publicUrl;
  let updatedRows;

  try {
    const { data, error: updateError } = await supabaseAdmin
      .from('Team')
      .update({ coach_image_url: publicUrl })
      .eq('id', id)
      .select();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!data?.length) {
      throw new Error('Team nije pronađen tijekom spremanja slike.');
    }

    updatedRows = data;
  } catch (error) {
    await removeCoachImage(supabaseAdmin, newFilePath);
    throw error;
  }

  let cleanupWarning = null;

  if (oldFilePath && oldFilePath !== newFilePath) {
    try {
      await removeCoachImage(supabaseAdmin, oldFilePath);
    } catch (error) {
      cleanupWarning =
        `Nova slika je spremljena, ali stara nije obrisana: ${error.message}`;
    }
  }

  return {
    publicUrl,
    data: updatedRows,
    cleanupWarning
  };
}

module.exports = {
  insertTeam,
  getAllTeams,
  updateTeam,
  replaceTeamCoachImage
};
