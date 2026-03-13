// data.js — Data loading and helper functions
let _data = null;

async function loadData() {
  if (_data) return _data;
  const res = await fetch('data/projects.json');
  _data = await res.json();
  return _data;
}

async function getAllProjects() {
  const { data, error } = await supabaseClient.from('projects').select('*');
  if (error) {
    console.error("Error fetching projects from Supabase:", error);
    return [];
  }
  // Format for frontend compatibility
  return data.map(p => ({
    ...p,
    problem: p.problem_statement || p.problem,
    approach: p.approach_summary || p.approach,
    team: typeof p.team === 'string' ? p.team.split(',').map(s=>s.trim()) : (p.team || [])
  }));
}

async function getAllQuestions() {
  const data = await loadData();
  return data.questions || [];
}

async function getAllStudents() {
  // Try fetching from Supabase first
  const { data, error } = await supabaseClient.from('users').select('*').order('legacy_score', { ascending: false });
  if (!error && data && data.length > 0) {
    return data.map(u => ({
      id: u.id,
      name: u.name,
      department: u.department,
      legacy_score: u.legacy_score,
      level: Math.floor((u.legacy_score || 0) / 100) + 1,
      level_title: u.legacy_score >= 1000 ? 'Legacy Builder' : 'Pioneer',
      projects: [], // We'd need a join here, but empty array for compatibility
      badges: []
    }));
  }
  
  // Fallback to local JSON if Supabase is unpopulated or errors
  const localData = await loadData();
  return localData.students || [];
}

async function getProjectById(id) {
  const projects = await getAllProjects();
  return projects.find(p => p.id === id);
}

async function getStudentById(id) {
  const students = await getAllStudents();
  return students.find(s => s.id === id);
}

async function getStudentByName(name) {
  const students = await getAllStudents();
  return students.find(s => s.name === name);
}

function getCategoryClass(cat) {
  const map = {
    'Food & Delivery': 'food',
    'Mental Health': 'mental-health',
    'Education': 'education',
    'EdTech': 'edtech',
    'Sustainability': 'sustainability',
    'Campus Safety': 'safety',
    'Marketplace': 'marketplace',
    'Career': 'career'
  };
  return map[cat] || 'category';
}

function getOutcomeClass(outcome) {
  return 'outcome-' + (outcome || '').toLowerCase();
}

function getTierClass(tier) {
  return 'tier-' + (tier || '').toLowerCase();
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getFromLS(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function saveToLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}



