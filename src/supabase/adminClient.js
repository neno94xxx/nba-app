const { createClient } = require('@supabase/supabase-js');

let adminClient = null;

function isLegacyAnonKey(key) {
  if (key.split('.').length !== 3) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(key.split('.')[1], 'base64url').toString('utf8')
    );

    return payload.role === 'anon';
  } catch {
    return false;
  }
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Nedostaje SUPABASE_URL u .env datoteci.');
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Nedostaje SUPABASE_SERVICE_ROLE_KEY u .env datoteci. ' +
      'Za Storage upload backend mora koristiti Supabase secret/service-role ključ.'
    );
  }

  if (
    serviceRoleKey.startsWith('sb_publishable_') ||
    isLegacyAnonKey(serviceRoleKey)
  ) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ne smije biti publishable/anon ključ.'
    );
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
}

module.exports = getSupabaseAdmin;
