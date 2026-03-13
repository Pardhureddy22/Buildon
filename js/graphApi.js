// graphApi.js — Client-side endpoints for fetching Knowledge Graph data from Supabase

/**
 * GET /api/graph/nodes
 * Retrieves all nodes (Projects, Problems, Approaches, Insights, Questions)
 * and formats them for Cytoscape.js
 */
async function getGraphNodes() {
  const nodes = [];

  try {
    // 1. Fetch Projects
    const { data: projects } = await supabaseClient.from('projects').select('id, title, category, outcome, year');
    if (projects) {
      projects.forEach(p => {
        nodes.push({
          data: { id: p.id, name: p.title, type: 'Project', category: p.category, outcome: p.outcome, year: p.year }
        });
      });
    }

    // 2. Fetch Problems
    const { data: problems } = await supabaseClient.from('problems').select('id, name, description');
    if (problems) {
      problems.forEach(p => {
        nodes.push({
          data: { id: p.id, name: p.name, type: 'Problem', description: p.description }
        });
      });
    }

    // 3. Fetch Approaches
    const { data: approaches } = await supabaseClient.from('approaches').select('id, name, description');
    if (approaches) {
      approaches.forEach(a => {
        nodes.push({
          data: { id: a.id, name: a.name, type: 'Approach', description: a.description }
        });
      });
    }

    // 4. Fetch Insights
    const { data: insights } = await supabaseClient.from('insights').select('id, insight_text, confidence_level');
    if (insights) {
      insights.forEach(i => {
        // Truncate long insight text for node label
        const name = i.insight_text.length > 40 ? i.insight_text.substring(0, 37) + '...' : i.insight_text;
        nodes.push({
          data: { id: i.id, name: name, type: 'Insight', description: i.insight_text, confidence: i.confidence_level }
        });
      });
    }

    // 5. Fetch Questions
    const { data: questions } = await supabaseClient.from('questions').select('id, question_text, status');
    if (questions) {
      questions.forEach(q => {
        const name = q.question_text.length > 40 ? q.question_text.substring(0, 37) + '...' : q.question_text;
        nodes.push({
          data: { id: q.id, name: name, type: 'Question', description: q.question_text, status: q.status }
        });
      });
    }

  } catch (error) {
    console.error("Error fetching graph nodes:", error);
  }

  return nodes;
}

/**
 * GET /api/graph/edges
 * Retrieves all relationship edges from the edges table
 * and formats them for Cytoscape.js
 */
async function getGraphEdges() {
  const edges = [];

  try {
    const { data } = await supabaseClient.from('edges').select('*');
    if (data) {
      data.forEach(e => {
        edges.push({
          data: {
            id: e.id,
            source: e.source_node_id,
            target: e.target_node_id,
            label: e.relationship_type
          }
        });
      });
    }
  } catch (error) {
    console.error("Error fetching graph edges:", error);
  }

  return edges;
}

/**
 * GET /api/graph/projects/:problemId
 * Example endpoint to find all projects addressing a specific problem
 */
async function getRelatedProjects(problemId) {
  try {
    // Requires a join in Supabase: select edges where target is problem, 
    // join with projects table. For a pure JS client, we fetch edges then filter.
    const { data: edges } = await supabaseClient
      .from('edges')
      .select('source_node_id')
      .eq('target_node_id', problemId)
      .eq('relationship_type', 'ADDRESSES')
      .eq('source_type', 'Project');
      
    if (!edges || edges.length === 0) return [];
    
    const projectIds = edges.map(e => e.source_node_id);
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('*')
      .in('id', projectIds);
      
    return projects || [];
  } catch (error) {
    console.error("Error fetching related projects:", error);
    return [];
  }
}
