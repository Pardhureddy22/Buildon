// js/supabaseClient.js

// Replace these with your actual Supabase Project URL and Anon Public Key
const SUPABASE_URL = 'https://iglymeqeifxczvypurmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbHltZXFlaWZ4Y3p2eXB1cm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDQwOTcsImV4cCI6MjA4ODkyMDA5N30.hZT1eU6DJaIbGu--Ba585xHvXIUskZADThx2oQBwVMg';

if (typeof supabase === 'undefined') {
  console.error("Supabase script not loaded. Ensure the CDN script is included before supabaseClient.js.");
}

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


