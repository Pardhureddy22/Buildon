// lineage.js — Horizontal lineage timeline

function buildLineageChain(project, allProjects) {
  const chain = [];
  
  // Walk back to root
  let current = project;
  const ancestors = [];
  while (current && current.forked_from) {
    const parent = allProjects.find(p => p.id === current.forked_from);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else break;
  }
  
  chain.push(...ancestors);
  chain.push(project);
  
  // Add direct forks
  if (project.forks && project.forks.length) {
    project.forks.forEach(fId => {
      const fork = allProjects.find(p => p.id === fId);
      if (fork) chain.push(fork);
    });
  }
  
  return chain;
}

function renderLineageTimeline(chain, currentId, container) {
  if (!container) return;
  if (chain.length <= 1) {
    container.innerHTML = '<p style="color:var(--text-muted);font-style:italic;padding:20px 0">This project has no lineage connections. It is an original work.</p>';
    return;
  }

  container.innerHTML = `<div class="lineage-timeline">
    ${chain.map((p, i) => `
      <div class="lineage-node ${p.id === currentId ? 'current' : ''}" style="${i < chain.length - 1 ? 'margin-right:40px' : ''}">
        <div class="lineage-dot" onclick="location.href='detail.html?id=${p.id}'" title="${p.title}">
          ${i + 1}
        </div>
        ${i < chain.length - 1 ? '<div style="position:absolute;top:20px;left:calc(50% + 20px);width:40px;height:2px;background:var(--light-border)"></div>' : ''}
        <div class="lineage-label">${p.title}</div>
        <div class="lineage-year">${p.year}</div>
      </div>
    `).join('')}
  </div>`;
}



