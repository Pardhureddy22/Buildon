// dashboard.js — Dashboard logic

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await requireAuth())) return;
  const session = await getSession();
  const projects = await getAllProjects();
  const questions = await getAllQuestions();
  const students = await getAllStudents();
  const submissions = getFromLS('buildon_submissions') || [];

  // If no projects exist, try seeding data (first run only)
  if (projects.length === 0 && typeof seedSupabaseFromJSON === 'function') {
    await seedSupabaseFromJSON();
  }

  // Render sidebar
  await renderDashboardSidebar('dashboard');

  // Welcome
  const sessionName = session?.user?.user_metadata?.name || 'Student';
  document.getElementById('welcomeName').textContent = sessionName;

  // Stats
  const userSubmissions = submissions.filter(s => s.team && s.team.some(t => t.toLowerCase().includes(sessionName.split(' ')[0].toLowerCase())));
  const totalForks = projects.reduce((s, p) => s + (p.forks ? p.forks.length : 0), 0);
  const openQ = questions.filter(q => q.status === 'open').length;

  // Try to find matching student for legacy score
  const matchedStudent = students.find(s => s.name.toLowerCase().includes(sessionName.split(' ')[0].toLowerCase()));
  const legacyScore = matchedStudent ? matchedStudent.legacy_score : userSubmissions.length * 50;

  document.getElementById('statSubmitted').textContent = userSubmissions.length || '0';
  document.getElementById('statForked').textContent = totalForks;
  document.getElementById('statAdopted').textContent = questions.filter(q => q.status === 'adopted').length;
  document.getElementById('statLegacy').textContent = legacyScore;

  // Activity feed
  const feed = [];
  projects.filter(p => p.forks && p.forks.length).forEach(p => {
    p.forks.forEach(fid => {
      const fork = projects.find(x => x.id === fid);
      if (fork) feed.push({ icon: '🔀', text: `<strong>${p.title}</strong> was forked into <strong>${fork.title}</strong>`, time: `${fork.year}`, sort: fork.year });
    });
  });
  questions.filter(q => q.status === 'adopted').slice(0, 3).forEach(q => {
    feed.push({ icon: '✋', text: `A question from <strong>${q.source_project_title}</strong> was adopted`, time: `${q.year_posted}`, sort: q.year_posted });
  });
  submissions.forEach(s => {
    feed.push({ icon: '📄', text: `New project <strong>${s.title}</strong> submitted in ${s.category}`, time: `${s.year || 'Recently'}`, sort: s.year || 2024 });
  });
  // Add some seed events from JSON data
  projects.slice(0, 3).forEach(p => {
    feed.push({ icon: '🚀', text: `<strong>${p.title}</strong> was documented by ${p.team[0]}`, time: `${p.year}`, sort: p.year });
  });

  feed.sort((a, b) => (b.sort || 0) - (a.sort || 0));
  const feedEl = document.getElementById('activityFeed');
  feedEl.innerHTML = feed.slice(0, 8).map(f => `
    <div class="feed-item">
      <div class="feed-icon">${f.icon}</div>
      <div class="feed-text">${f.text}</div>
      <div class="feed-time">${f.time}</div>
    </div>
  `).join('');

  // Continue building — recommend projects with open questions in user's area
  const continueEl = document.getElementById('continueBuild');
  const recommended = projects
    .filter(p => p.open_questions && p.open_questions.some(q => q.status === 'open'))
    .sort((a, b) => b.legacy_score - a.legacy_score)
    .slice(0, 3);

  continueEl.innerHTML = recommended.map(p => `
    <div class="recommend-card" onclick="location.href='detail.html?id=${p.id}'">
      <div class="recommend-header">
        <span class="tag tag-${getCategoryClass(p.category)}">${p.category}</span>
        <span class="tier-badge ${getTierClass(p.quality_tier)}">${p.quality_tier}</span>
      </div>
      <div class="recommend-title">${p.title}</div>
      <div class="recommend-meta">${p.team.join(', ')} · ${p.year}</div>
      <div class="recommend-reason">
        <span style="color:var(--info)">❓</span> ${p.open_questions.filter(q => q.status === 'open').length} open question${p.open_questions.filter(q => q.status === 'open').length !== 1 ? 's' : ''} waiting
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-muted)">No recommendations right now.</p>';
});



