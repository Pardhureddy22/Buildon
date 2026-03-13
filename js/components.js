// components.js — Shared UI components

async function initPage(activePage) {
  await renderNavbar(activePage);
  renderFooter();
}

async function renderNavbar(active) {
  const el = document.getElementById('navbar');
  if (!el) return;
  const links = [
    { href: 'explorer.html', label: 'Explore', id: 'explore' },
    { href: 'questions.html', label: 'Questions', id: 'questions' },
    { href: 'leaderboard.html', label: 'Leaderboard', id: 'leaderboard' }
  ];
  // Check session for login state
  const session = typeof getSession === 'function' ? await getSession() : null;
  const sessionName = session ? await getSessionName() : null;
  const userHtml = sessionName
    ? `<li><a href="dashboard.html" class="nav-user-pill"><span class="user-avatar-sm">${getInitials(sessionName)}</span>${sessionName.split(' ')[0]}</a></li>`
    : `<li><a href="login.html" class="nav-submit-btn" style="background:var(--dark-surface)">Login</a></li>`;

  el.innerHTML = `<nav class="navbar" id="mainNav">
    <div class="container">
      <a href="index.html" class="nav-logo">BuildOn</a>
      <ul class="nav-links">
        ${links.map(l => `<li><a href="${l.href}" class="${active === l.id ? 'active' : ''}">${l.label}</a></li>`).join('')}
        <li><a href="submit.html" class="nav-submit-btn">Submit Project</a></li>
        ${userHtml}
      </ul>
      <button class="nav-toggle" onclick="document.getElementById('mainNav').classList.toggle('open')" aria-label="Menu">☰</button>
    </div>
  </nav>`;
}

// Dashboard sidebar
async function renderDashboardSidebar(active) {
  const el = document.getElementById('appSidebar');
  if (!el) return;
  const session = typeof getSession === 'function' ? await getSession() : null;
  const sessionName = session ? await getSessionName() : null;
  const sessionEmail = session ? await getSessionEmail() : null;
  const menuItems = [
    { id: 'index', name: 'Home', icon: '🏠', href: 'index.html' },
    { id: 'explorer', name: 'Explore Projects', icon: '🔍', href: 'explorer.html' },
    { id: 'graph', name: 'Knowledge Graph', icon: '🕸️', href: 'idea-graph.html' },
    { id: 'myprojects', name: 'My Projects', icon: '📁', href: 'my-projects.html' },
    { id: 'gaps', name: 'Innovation Gaps', icon: '💡', href: 'gaps.html' },
    { id: 'questions', name: 'Open Questions', icon: '❓', href: 'questions.html' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆', href: 'leaderboard.html' },
    { id: 'submit', name: 'Submit Project', icon: '➕', href: 'submit.html' },
    { id: 'profile', name: 'Profile', icon: '👤', href: 'profile.html' }
  ];
  el.innerHTML = `
    <div class="sidebar-brand"><a href="index.html" class="nav-logo" style="color:#fff;font-size:20px">BuildOn</a></div>
    <nav class="sidebar-nav">
      ${menuItems.map(i => `<a href="${i.href}" class="sidebar-item ${active === i.id ? 'active' : ''}"><span class="sidebar-icon">${i.icon}</span>${i.name}</a>`).join('')}
    </nav>
    <div class="sidebar-bottom">
      ${sessionName ? `<div class="sidebar-user">
        <div class="user-avatar-sm">${getInitials(sessionName)}</div>
        <div class="sidebar-user-info"><div class="sidebar-user-name">${sessionName}</div><div class="sidebar-user-email">${sessionEmail}</div></div>
      </div>` : ''}
      <a href="#" class="sidebar-item sidebar-logout" onclick="logoutUser();return false"><span class="sidebar-icon">🚪</span>Logout</a>
    </div>
  `;
  // User pill in topbar
  const pillEl = document.getElementById('userPill');
  if (pillEl && session) {
    pillEl.innerHTML = `<span class="user-avatar-sm">${getInitials(sessionName)}</span><span>${sessionName}</span>`;
  }
}

function renderFooter() {
  const el = document.getElementById('footer');
  if (!el) return;
  el.innerHTML = `<footer class="footer">
    <div class="container">
      <div class="footer-logo">BuildOn</div>
      <div class="footer-links">
        <a href="explorer.html">Explore</a>
        <a href="questions.html">Questions</a>
        <a href="leaderboard.html">Leaderboard</a>
        <a href="submit.html">Submit</a>
      </div>
      <div class="footer-copy">© 2024 BuildOn. Student Project Memory Platform.</div>
    </div>
  </footer>`;
}

function renderProjectCard(p) {
  const catClass = getCategoryClass(p.category);
  const outcomeClass = getOutcomeClass(p.outcome);
  const tierClass = getTierClass(p.quality_tier);
  const forkCount = p.forks ? p.forks.length : 0;
  return `<div class="card project-card" onclick="location.href='detail.html?id=${p.id}'">
    <div class="project-card-header">
      <span class="tag tag-${catClass}">${p.category || 'Uncategorized'}</span>
      <span class="tier-badge ${tierClass}">${p.quality_tier || 'Bronze'}</span>
    </div>
    <div>
      <div class="project-card-title">${p.title || 'Untitled Project'}</div>
      <div class="project-card-team">${p.team && p.team.filter(Boolean).length ? p.team.filter(Boolean).join(', ') : 'Anonymous'} · ${p.year || 'Unknown Year'}</div>
    </div>
    <div class="project-card-body">${p.problem || 'No description provided.'}</div>
    <div class="project-card-footer">
      <span class="outcome-badge ${outcomeClass}">${p.outcome}</span>
      <span class="fork-count">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v6m0 0a3 3 0 1 0 3 3V9M18 3v6m0 0a3 3 0 0 1-3 3v0a3 3 0 0 1-3-3"/><circle cx="6" cy="18" r="3"/></svg>
        ${forkCount}
      </span>
    </div>
  </div>`;
}

function renderStatCounter(num, label, id) {
  return `<div class="stat-item">
    <span class="stat-number" data-target="${num}" id="${id}">0</span>
    <span class="stat-label">${label}</span>
  </div>`;
}

function animateCounters() {
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function renderSkeletons(count, container) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += '<div class="skeleton skeleton-card"></div>';
  }
  container.innerHTML = html;
}

function renderEmptyState(icon, title, subtitle) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3>
    <p>${subtitle}</p>
  </div>`;
}

function renderQuestionCard(q, showAdopt) {
  const statusClass = 'status-' + q.status;
  const adoptBtn = showAdopt && q.status === 'open'
    ? `<button class="btn btn-teal btn-sm" onclick="event.stopPropagation()">Adopt</button>`
    : '';
  return `<div class="question-list-item">
    <div class="ql-content">
      <div class="ql-text">${q.text}</div>
      <div class="ql-meta">
        <span>${q.source_project_title || ''}</span>
        <span class="divider"></span>
        <span>${q.year_posted || q.year || ''}</span>
        <span class="divider"></span>
        <span class="tag tag-${getCategoryClass(q.category)}">${q.category}</span>
        <span class="status-badge ${statusClass}">${q.status}</span>
        ${q.times_attempted ? `<span class="attempt-badge">⟳ ${q.times_attempted} attempted</span>` : ''}
      </div>
    </div>
    ${adoptBtn}
  </div>`;
}



