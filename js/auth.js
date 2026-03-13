// auth.js — Supabase Authentication logic

async function registerUser(name, email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Insert user profile into public.users
  if (data.user) {
    const { error: insertError } = await supabaseClient.from('users').insert([{
      id: data.user.id,
      name: name,
      email: email,
      department: 'General'
    }]);
    if(insertError) console.error("Error creating user profile:", insertError);
  }

  return { success: true };
}

async function loginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, user: data.user };
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  location.href = 'login.html';
}



