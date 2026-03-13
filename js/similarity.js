// similarity.js — Real-time similarity search with debounce
function findSimilarProjects(query, projects, excludeId) {
  if (!query || query.length < 3) return [];
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return [];

  const scored = projects
    .filter(p => p.id !== excludeId)
    .map(p => {
      const text = `${p.title} ${p.problem} ${p.category} ${(p.tags || []).join(' ')}`.toLowerCase();
      let score = 0;
      terms.forEach(t => {
        if (text.includes(t)) score += 2;
        // Partial matches
        const words = text.split(/\s+/);
        words.forEach(w => {
          if (w.startsWith(t) || t.startsWith(w)) score += 1;
        });
      });
      return { project: p, score };
    })
    .filter(s => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map(s => s.project);
}

function renderSimilarityBanner(similar, container) {
  if (!similar.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `<div class="similarity-banner" onclick="this.classList.toggle('expanded')">
    <div class="similarity-header">
      <span>⚡ ${similar.length} similar project${similar.length !== 1 ? 's' : ''} found before yours</span>
      <span class="similarity-arrow">▼</span>
    </div>
    <div class="similarity-projects">
      ${similar.map(p => `<div class="similarity-row">
        <a href="detail.html?id=${p.id}" style="font-weight:500">${p.title}</a>
        <span style="font-size:13px;color:var(--text-muted)">${p.year} · ${p.outcome}</span>
      </div>`).join('')}
    </div>
  </div>`;
}



