// js/seedData.js — One-time script to populate a fresh Supabase instance with existing projects.json test data

async function seedSupabaseFromJSON() {
  try {
    // 1. Check if projects exist in Supabase
    const { data: existingProjects, error: countError } = await supabaseClient
      .from('projects')
      .select('id')
      .limit(1);

    if (countError) {
      console.error("Error checking for existing Supabase projects. Ensure your schema is created.", countError);
      return;
    }

    // If data already exists, don't seed again
    if (existingProjects && existingProjects.length > 0) {
      return; 
    }

    console.log("Empty Supabase instance detected. Seeding with initial test data from projects.json...");

    // 2. Fetch the local JSON
    const res = await fetch('data/projects.json');
    const localData = await res.json();
    
    // We cannot easily seed Users because Supabase Auth handles that via /auth/v1 endpoints which we cannot fake. 
    // Usually, we'd need them to sign up first. For demonstration, we will rely on NULL user_id for original projects or seed dummy public profiles if RLS allows.
    
    // 3. Prepare Projects
    const projectsToInsert = localData.projects.map(p => ({
      title: p.title,
      year: p.year,
      team: p.team ? p.team.join(', ') : 'Unknown',
      category: p.category,
      outcome: p.outcome,
      problem_statement: p.problem,
      approach_summary: p.approach,
      key_insights: p.insights || [],
      open_questions: p.open_questions ? p.open_questions.map(q => q.text) : [],
      tags: p.tags || [],
      fork_count: p.forks ? p.forks.length : 0
    }));

    // Insert Projects
    if (projectsToInsert.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('projects')
        .insert(projectsToInsert);

      if (insertError) {
        console.error("Error seeding projects:", insertError);
      } else {
        console.log(`Successfully seeded ${projectsToInsert.length} core projects into Supabase.`);
        // Reload page to show new data
        location.reload();
      }
    }

  } catch (err) {
    console.error("Seed script failed:", err);
  }
}

// Expose globally so it can be called exactly once or automatically
window.seedSupabaseFromJSON = seedSupabaseFromJSON;


