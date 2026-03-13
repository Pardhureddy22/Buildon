// session.js — Supabase Session management

async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

async function isLoggedIn() {
  const session = await getSession();
  return !!session;
}

async function requireAuth() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    location.href = 'login.html';
    return false;
  }
  return true;
}

async function getSessionName() {
  const session = await getSession();
  return session?.user?.user_metadata?.name || 'Student';
}

async function getSessionEmail() {
  const session = await getSession();
  return session?.user?.email || '';
}

async function getSessionUserId() {
  const session = await getSession();
  return session?.user?.id || null;
}



