// heatmap.js — Idea cluster grid (not a bubble chart)
function renderHeatmap(projects, questions) {
  const grid = document.getElementById('heatmapGrid');
  if (!grid) return;

  // Group by category
  const cats = {};
  projects.forEach(p => {
    if (!cats[p.category]) cats[p.category] = { count: 0, openQ: 0 };
    cats[p.category].count++;
  });
  if (questions) {
    questions.forEach(q => {
      if (q.status === 'open' && cats[q.category]) cats[q.category].openQ++;
    });
  }

  const maxCount = Math.max(...Object.values(cats).map(c => c.count));

  grid.innerHTML = Object.entries(cats).map(([cat, data]) => {
    const pct = Math.round((data.count / maxCount) * 100);
    const catClass = getCategoryClass(cat);
    return `<div class="heatmap-card">
      <h4><span class="tag tag-${catClass}" style="margin-right:8px">${cat}</span></h4>
      <div class="heatmap-bar"><div class="heatmap-bar-fill" style="width:${pct}%"></div></div>
      <div class="heatmap-meta">
        <span>${data.count} project${data.count !== 1 ? 's' : ''}</span>
        <span>${data.openQ} open question${data.openQ !== 1 ? 's' : ''}</span>
      </div>
    </div>`;
  }).join('');
}



