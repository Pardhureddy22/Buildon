// leaderboard.js — Leaderboard logic
document.addEventListener('DOMContentLoaded', async () => {
  await renderDashboardSidebar('leaderboard');
  const students = await getAllStudents();
  const projects = await getAllProjects();

  // Badge emoji map
  const badgeEmojis = {
    'badge_fork_pioneer': '🔱', 'badge_persistent': '🔄', 'badge_mentor': '🎓',
    'badge_deployed': '🚀', 'badge_legacy_builder': '🏗️', 'badge_impact_100': '💯',
    'badge_cross_dept': '🌉', 'badge_forker': '🤝', 'badge_gold_tier': '🥇',
    'badge_platinum_tier': '💎', 'badge_first_project': '🌱', 'badge_safety_champion': '🛡️',
    'badge_green_champion': '🌿', 'badge_social_impact': '❤️', 'badge_multi_domain': '🎨'
  };

  function renderEntry(student, rank) {
    const rankClass = rank <= 3 ? ` rank-${rank}` : '';
    const initials = getInitials(student.name);
    const badges = (student.badges || []).slice(0, 3);
    return `<div class="leaderboard-entry${rankClass}" onclick="location.href='profile.html?id=${student.id}'" style="cursor:pointer">
      <div class="rank-number">${rank}</div>
      <div class="lb-avatar">${initials}</div>
      <div class="lb-info">
        <div class="lb-name">${student.name}</div>
        <div class="lb-dept">${student.department}</div>
        <div class="lb-level">Lv.${student.level} · ${student.level_title}</div>
      </div>
      <div class="lb-badges">
        ${badges.map(b => `<div class="lb-badge-icon">${badgeEmojis[b.id] || '⭐'}<span class="badge-tooltip">${b.name}</span></div>`).join('')}
      </div>
      <div class="lb-stats">
        <div class="lb-score">${student.legacy_score}</div>
        <div class="lb-sub">${student.projects.length} project${student.projects.length !== 1 ? 's' : ''}</div>
      </div>
    </div>`;
  }

  // All time — sort by legacy score
  const allTime = [...students].sort((a, b) => b.legacy_score - a.legacy_score);
  document.getElementById('alltimeList').innerHTML = allTime.map((s, i) => renderEntry(s, i + 1)).join('');

  // This semester (2024)
  const semester = students.filter(s => s.projects.some(pid => {
    const proj = projects.find(p => p.id === pid);
    return proj && proj.year === 2024;
  })).sort((a, b) => b.legacy_score - a.legacy_score);
  document.getElementById('semesterList').innerHTML = semester.length
    ? semester.map((s, i) => renderEntry(s, i + 1)).join('')
    : renderEmptyState('📅', 'No data for this semester', 'Check back when projects are submitted.');

  // Most impactful failures — students whose abandoned/failed projects led to forks
  const impactful = students.filter(s => {
    return s.projects.some(pid => {
      const proj = projects.find(p => p.id === pid);
      return proj && (proj.outcome === 'Abandoned' || proj.failures.length >= 2) && proj.forks && proj.forks.length > 0;
    });
  }).sort((a, b) => b.legacy_score - a.legacy_score);
  document.getElementById('failuresList').innerHTML = impactful.length
    ? impactful.map((s, i) => renderEntry(s, i + 1)).join('')
    : renderEmptyState('💡', 'No impactful failures yet', 'Failures that lead to forks appear here.');

  // Alumni — graduated (year < 2025)
  const alumni = students.filter(s => s.graduation_year && s.graduation_year <= 2024)
    .sort((a, b) => b.legacy_score - a.legacy_score).slice(0, 6);
  document.getElementById('alumniList').innerHTML = alumni.map((s, i) => {
    const initials = getInitials(s.name);
    return `<div class="leaderboard-entry" onclick="location.href='profile.html?id=${s.id}'" style="cursor:pointer;margin-bottom:12px">
      <div class="lb-avatar">${initials}</div>
      <div class="lb-info">
        <div class="lb-name">${s.name}</div>
        <div class="lb-dept">${s.department} · Class of ${s.graduation_year}</div>
      </div>
      <div class="lb-stats">
        <div class="lb-score">${s.legacy_score} <span style="font-size:12px;color:var(--success)">↑</span></div>
        <div class="lb-sub">legacy score</div>
      </div>
    </div>`;
  }).join('');

  // Tab switching
  document.querySelectorAll('#lbTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#lbTabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
});



