// explorer.js — Explorer page logic
document.addEventListener('DOMContentLoaded', async () => {
  await renderDashboardSidebar('explore');
  const projects = await getAllProjects();
  let filtered = [...projects];

  const grid = document.getElementById('projectGrid');
  const countEl = document.getElementById('projectCount');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const emptyState = document.getElementById('emptyState');
  const simContainer = document.getElementById('similarityContainer');

  // Show skeleton while loading
  renderSkeletons(6, grid);
  setTimeout(() => render(), 100);

  // Filters state
  const filters = { category: 'all', year: 'all', outcome: 'all', tier: 'all' };

  // Setup filter pills
  ['filterCategory', 'filterYear', 'filterOutcome', 'filterTier'].forEach(rowId => {
    const row = document.getElementById(rowId);
    const key = rowId.replace('filter', '').toLowerCase();
    row.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        row.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filters[key] = pill.dataset.value;
        render();
      });
    });
  });

  // Sort
  sortSelect.addEventListener('change', render);

  // Search with debounce
  const debouncedSearch = debounce(() => {
    const q = searchInput.value.trim();
    const similar = findSimilarProjects(q, projects);
    renderSimilarityBanner(similar, simContainer);
    render();
  }, 300);
  searchInput.addEventListener('input', debouncedSearch);

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    filtered = projects.filter(p => {
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.year !== 'all' && String(p.year) !== filters.year) return false;
      if (filters.outcome !== 'all' && p.outcome !== filters.outcome) return false;
      if (filters.tier !== 'all' && p.quality_tier !== filters.tier) return false;
      if (query) {
        const text = `${p.title} ${p.problem} ${p.category} ${p.team.join(' ')} ${(p.tags||[]).join(' ')}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });

    // Sort
    const sort = sortSelect.value;
    if (sort === 'recent') filtered.sort((a, b) => b.year - a.year);
    else if (sort === 'rank') filtered.sort((a, b) => b.rank_score - a.rank_score);
    else if (sort === 'forks') filtered.sort((a, b) => (b.forks?.length||0) - (a.forks?.length||0));
    else if (sort === 'legacy') filtered.sort((a, b) => b.legacy_score - a.legacy_score);
    else if (sort === 'alpha') filtered.sort((a, b) => a.title.localeCompare(b.title));

    countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      emptyState.innerHTML = renderEmptyState('🔍', 'No projects found', 'Try adjusting your search or filters.');
    } else {
      emptyState.style.display = 'none';
      grid.innerHTML = filtered.map(p => renderProjectCard(p)).join('');
    }
  }
});



