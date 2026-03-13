// idea-graph.js — Cytoscape graph initialization and interactions

let cy;

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await requireAuth())) return;
  await renderDashboardSidebar('graph');
  
  const sessionName = await getSessionName();
  document.getElementById('userPill').innerHTML = `<span class="user-avatar-sm">${getInitials(sessionName)}</span><span>${sessionName}</span>`;

  await initGraph();
  
  document.getElementById('btnRelayout').addEventListener('click', () => {
    if (cy) cy.layout({ name: 'cola', maxSimulationTime: 3000, nodeSpacing: 50, edgeLengthVal: 100, randomize: true }).run();
  });
});

async function initGraph() {
  document.getElementById('graphLoading').style.display = 'block';

  try {
    // Fetch nodes and edges from Supabase API endpoints
    const nodes = await getGraphNodes();
    const edges = await getGraphEdges();

    // Initialize Cytoscape
    cy = cytoscape({
      container: document.getElementById('cy'),
      elements: [...nodes, ...edges],

      style: [
        // Default Node Style
        {
          selector: 'node',
          style: {
            'label': 'data(name)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'color': '#ffffff',
            'font-size': '12px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 500,
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'width': 36,
            'height': 36,
            'background-color': '#777', // Default fallback
            'border-width': 2,
            'border-color': '#ffffff',
            'overlay-color': '#339af0',
            'overlay-opacity': 0,
            'transition-property': 'background-color, border-width',
            'transition-duration': '0.2s'
          }
        },
        // Entity specific colors
        {
          selector: 'node[type = "Project"]',
          style: {
            'background-color': '#4dabf7', // Blue
            'width': 48,
            'height': 48,
            'shape': 'hexagon'
          }
        },
        {
          selector: 'node[type = "Problem"]',
          style: {
            'background-color': '#ff6b6b', // Red
            'width': 56,
            'height': 56,
            'shape': 'round-rectangle',
            'font-size': '14px',
            'font-weight': 'bold'
          }
        },
        {
          selector: 'node[type = "Approach"]',
          style: {
            'background-color': '#51cf66', // Green
            'width': 40,
            'height': 40
          }
        },
        {
          selector: 'node[type = "Insight"]',
          style: {
            'background-color': '#fcc419', // Yellow
            'shape': 'diamond'
          }
        },
        {
          selector: 'node[type = "Question"]',
          style: {
            'background-color': '#cc5de8', // Purple
            'shape': 'triangle'
          }
        },
        // Selected node highlighting
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#fff',
            'overlay-opacity': 0.2
          }
        },
        // Edge Styling
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#4a4a5e',
            'target-arrow-color': '#4a4a5e',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'color': '#8e8ea0',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'text-background-opacity': 1,
            'text-background-color': '#0f0f13',
            'text-background-padding': 2,
            'text-background-shape': 'roundrectangle'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#339af0',
            'target-arrow-color': '#339af0',
            'width': 3
          }
        }
      ],

      // Initial layout using WebCola for physics spacing
      layout: {
        name: 'cola',
        animate: true,
        maxSimulationTime: 2000,
        nodeSpacing: 40,
        edgeLengthVal: 90
      },

      // Interaction settings
      wheelSensitivity: 0.2,
      minZoom: 0.2,
      maxZoom: 3
    });

    // Mount click listeners for the sidebar panel
    cy.on('tap', 'node', function(evt){
      const node = evt.target;
      openPanel(node.data());
    });

    cy.on('tap', function(evt){
      if(evt.target === cy){
        closePanel();
      }
    });

  } catch (error) {
    console.error("Failed to initialize graph:", error);
  } finally {
    document.getElementById('graphLoading').style.display = 'none';
  }
}

// Side Panel Interactions
function openPanel(data) {
  const panel = document.getElementById('graphPanel');
  panel.classList.add('active');
  
  document.getElementById('panelType').textContent = data.type;
  document.getElementById('panelTitle').textContent = data.name;

  let desc = '';
  let metaHtml = '';

  if (data.type === 'Project') {
    desc = 'A student initiative aiming to solve a specific problem.';
    metaHtml = `
      <div style="margin-bottom:8px"><strong>Category:</strong> ${data.category || 'N/A'}</div>
      <div style="margin-bottom:8px"><strong>Outcome:</strong> ${data.outcome || 'N/A'}</div>
      <div><strong>Year:</strong> ${data.year || 'N/A'}</div>
    `;
  } 
  else if (data.type === 'Problem') {
    desc = data.description || 'No description provided.';
  }
  else if (data.type === 'Approach') {
    desc = data.description || 'A technical or strategic path taken.';
  }
  else if (data.type === 'Insight') {
    desc = data.description || 'A learning discovered while building.';
    metaHtml = `<div><strong>Confidence:</strong> <span style="text-transform:capitalize">${data.confidence || 'Medium'}</span></div>`;
  }
  else if (data.type === 'Question') {
    desc = data.description || 'A challenge left unsolved.';
    metaHtml = `<div><strong>Status:</strong> <span style="text-transform:capitalize">${data.status || 'Open'}</span></div>`;
  }

  document.getElementById('panelDesc').textContent = desc;
  document.getElementById('panelMeta').innerHTML = metaHtml;
}

function closePanel() {
  document.getElementById('graphPanel').classList.remove('active');
  if (cy) {
    cy.elements().unselect();
  }
}
