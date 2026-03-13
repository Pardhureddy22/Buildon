// submit.js — Multi-step form logic
let currentStep = 1;
let failures = [];
let questions = [];
let insights = [];
let allProjects = [];

document.addEventListener('DOMContentLoaded', async () => {
  await renderDashboardSidebar('submit');
  allProjects = await getAllProjects();

  // Similarity check on title
  const titleInput = document.getElementById('f_title');
  const simContainer = document.getElementById('titleSimilarity');
  const debouncedSim = debounce(() => {
    const similar = findSimilarProjects(titleInput.value, allProjects);
    renderSimilarityBanner(similar, simContainer);
  }, 300);
  titleInput.addEventListener('input', debouncedSim);

  // Validation listeners step 1
  ['f_title','f_team','f_year','f_category','f_outcome'].forEach(id => {
    document.getElementById(id).addEventListener('input', validateStep1);
    document.getElementById(id).addEventListener('change', validateStep1);
  });

  // Char counts step 2
  ['f_problem','f_approach','f_worked'].forEach(id => {
    const el = document.getElementById(id);
    const cc = document.getElementById('cc_' + id.replace('f_',''));
    el.addEventListener('input', () => {
      cc.textContent = el.value.length;
      validateStep2();
    });
  });

  // Check fork param
  const params = new URLSearchParams(location.search);
  const forkId = params.get('fork');
  if (forkId) {
    const parent = await getProjectById(forkId);
    if (parent) {
      document.getElementById('f_category').value = parent.category;
    }
  }
});

function validateStep1() {
  const ok = ['f_title','f_year','f_category','f_outcome'].every(id => document.getElementById(id).value.trim());
  document.getElementById('next1').disabled = !ok;
}

function validateStep2() {
  const ok = ['f_problem','f_approach','f_worked'].every(id => document.getElementById(id).value.length >= 50);
  document.getElementById('next2').disabled = !ok;
}

function goStep(step) {
  // Validate before advancing
  if (step === 5) {
    buildReview();
  }

  currentStep = step;
  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + step).classList.add('active');

  // Update progress bar
  document.querySelectorAll('.progress-step').forEach((s, i) => {
    s.classList.remove('active','completed');
    if (i + 1 < step) s.classList.add('completed');
    if (i + 1 === step) s.classList.add('active');
  });
  // Update step circle content
  document.querySelectorAll('.progress-step').forEach((s, i) => {
    const circle = s.querySelector('.step-circle');
    if (i + 1 < step) circle.innerHTML = '✓';
    else circle.innerHTML = i + 1;
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Failure management
let failureCount = 0;
function addFailure() {
  failureCount++;
  const id = 'failure_' + failureCount;
  const div = document.createElement('div');
  div.className = 'removable-card failure';
  div.id = id;
  div.innerHTML = `
    <button class="remove-btn" onclick="removeFailure('${id}')">&times;</button>
    <div class="form-group"><label class="form-label">Failure Title</label><input class="form-input" data-field="title" placeholder="What went wrong?"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" data-field="desc" placeholder="Describe what happened and why..." rows="3"></textarea></div>
  `;
  document.getElementById('failureList').appendChild(div);
  updateFailures();
}

function removeFailure(id) {
  document.getElementById(id).remove();
  updateFailures();
}

function updateFailures() {
  failures = [];
  document.querySelectorAll('#failureList .removable-card').forEach(card => {
    const title = card.querySelector('[data-field="title"]').value;
    const desc = card.querySelector('[data-field="desc"]').value;
    if (title || desc) failures.push({ title, description: desc });
  });
}

// Question management
let questionCount = 0;
function addQuestion() {
  questionCount++;
  const id = 'question_' + questionCount;
  const div = document.createElement('div');
  div.className = 'removable-card question-entry';
  div.id = id;
  div.innerHTML = `
    <button class="remove-btn" onclick="removeQuestion('${id}')">&times;</button>
    <div class="form-group" style="margin:0"><input class="form-input" data-field="text" placeholder="What question would you leave for the next team?"></div>
  `;
  document.getElementById('questionList').appendChild(div);
  updateQuestions();
}

function removeQuestion(id) {
  document.getElementById(id).remove();
  updateQuestions();
}

function updateQuestions() {
  questions = [];
  document.querySelectorAll('#questionList .removable-card').forEach(card => {
    const text = card.querySelector('[data-field="text"]').value;
    if (text) questions.push({ text, status: 'open' });
  });
}

// Insight management
let insightCount = 0;
function addInsight() {
  insightCount++;
  const id = 'insight_' + insightCount;
  const div = document.createElement('div');
  div.className = 'removable-card insight-entry';
  div.id = id;
  div.innerHTML = `
    <button class="remove-btn" onclick="removeInsight('${id}')">&times;</button>
    <div class="form-group" style="margin-bottom:8px"><input class="form-input" data-field="text" placeholder="What insight would you share?"></div>
    <div class="confidence-selector">
      <button class="confidence-btn" onclick="setConfidence('${id}','high',this)" data-conf="high">High</button>
      <button class="confidence-btn" onclick="setConfidence('${id}','medium',this)" data-conf="medium">Medium</button>
      <button class="confidence-btn" onclick="setConfidence('${id}','low',this)" data-conf="low">Low</button>
    </div>
  `;
  div.dataset.confidence = 'medium';
  document.getElementById('insightList').appendChild(div);
  updateInsights();
}

function setConfidence(id, level, btn) {
  const card = document.getElementById(id);
  card.dataset.confidence = level;
  card.querySelectorAll('.confidence-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  updateInsights();
}

function removeInsight(id) {
  document.getElementById(id).remove();
  updateInsights();
}

function updateInsights() {
  insights = [];
  document.querySelectorAll('#insightList .removable-card').forEach(card => {
    const text = card.querySelector('[data-field="text"]').value;
    const conf = card.dataset.confidence || 'medium';
    if (text) insights.push({ text, confidence: conf });
  });
}

function buildReview() {
  updateFailures();
  updateQuestions();
  updateInsights();
  const data = gatherData();
  document.getElementById('reviewContent').innerHTML = `
    <div class="review-card">
      <h4>Project Basics <button class="btn btn-ghost btn-sm" onclick="goStep(1)">Edit</button></h4>
      <div class="review-content">
        <strong>${data.title}</strong><br>
        Team: ${data.team.join(', ')}<br>
        ${data.year} · ${data.category} · ${data.outcome}
        ${data.git_link ? `<br><a href="${data.git_link}" target="_blank" style="color:var(--accent);font-size:13px;display:inline-flex;align-items:center;gap:4px;margin-top:6px"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> ${data.git_link}</a>` : ''}
      </div>
    </div>
    <div class="review-card">
      <h4>The Work <button class="btn btn-ghost btn-sm" onclick="goStep(2)">Edit</button></h4>
      <div class="review-content">
        <div class="detail-section-label" style="margin-top:8px">PROBLEM</div>
        <p>${data.problem}</p>
        <div class="detail-section-label" style="margin-top:16px">APPROACH</div>
        <p>${data.approach}</p>
        <div class="detail-section-label" style="margin-top:16px">WHAT WORKED</div>
        <p>${data.what_worked}</p>
      </div>
    </div>
    <div class="review-card">
      <h4>Failures (${data.failures.length}) <button class="btn btn-ghost btn-sm" onclick="goStep(3)">Edit</button></h4>
      <div class="review-content">${data.failures.map(f => `<div class="failure-card" style="margin-top:8px"><h4>⚠️ ${f.title}</h4><p>${f.description}</p></div>`).join('')}</div>
    </div>
    <div class="review-card">
      <h4>Questions & Insights <button class="btn btn-ghost btn-sm" onclick="goStep(4)">Edit</button></h4>
      <div class="review-content">
        <strong>Questions (${data.open_questions.length}):</strong>
        <ul style="list-style:disc;padding-left:20px;margin:8px 0">${data.open_questions.map(q => `<li>${q.text}</li>`).join('')}</ul>
        <strong>Insights (${data.insights.length}):</strong>
        ${data.insights.map((ins, i) => `<div class="insight-row" style="padding:8px 0"><div class="insight-number">${i+1}</div><div class="insight-text">${ins.text}</div><div class="confidence-dot confidence-${ins.confidence}"></div></div>`).join('')}
      </div>
    </div>
  `;
}

function gatherData() {
  updateFailures();
  updateQuestions();
  updateInsights();
  return {
    id: 'proj_' + Date.now(),
    title: document.getElementById('f_title').value.trim(),
    team: document.getElementById('f_team').value.split(',').map(s => s.trim()).filter(Boolean),
    year: parseInt(document.getElementById('f_year').value),
    category: document.getElementById('f_category').value,
    outcome: document.getElementById('f_outcome').value,
    git_link: document.getElementById('f_gitlink').value.trim() || null,
    problem: document.getElementById('f_problem').value.trim(),
    approach: document.getElementById('f_approach').value.trim(),
    what_worked: document.getElementById('f_worked').value.trim(),
    failures,
    insights,
    open_questions: questions,
    quality_tier: 'Bronze',
    rank_score: 0,
    impact_score: 0,
    legacy_score: 0,
    tags: [],
    forked_from: new URLSearchParams(location.search).get('fork') || null,
    forks: []
  };
}

async function submitProject() {
  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></span> Submitting...';
  btn.disabled = true;

  try {
    const data = gatherData();
    const userId = await getSessionUserId();
    const userEmail = await getSessionEmail();
    const userName = await getSessionName();

    // Auto-heal public user profile if it was dropped during schema reset
    if (userId) {
      const { error: upsertErr } = await supabaseClient.from('users').upsert([{
        id: userId,
        name: userName || (userEmail ? userEmail.split('@')[0] : 'Unknown'),
        email: userEmail,
        department: 'General'
      }]);
      if (upsertErr) console.error("Profile Upsert Error:", upsertErr);
    }

    const { data: projData, error } = await supabaseClient.from('projects').insert([{
      title: data.title,
      team: data.team.join(', '),
      year: data.year,
      category: data.category,
      outcome: data.outcome,
      problem_statement: data.problem,
      approach_summary: data.approach,
      key_insights: data.insights || [],
      open_questions: data.open_questions.map(q => q.text),
      tags: data.tags || [],
      forked_from: data.forked_from || null,
      user_id: userId
    }]).select();

    if (error) throw error;
    const newProject = projData[0];

    // --- KNOWLEDGE GRAPH INSERTIONS ---
    
    // 1. Insert Problem
    const { data: probData } = await supabaseClient.from('problems').insert([{
      name: data.title + ' Problem',
      description: data.problem
    }]).select();
    const probId = probData ? probData[0].id : null;

    // 2. Insert Approach
    const { data: appData } = await supabaseClient.from('approaches').insert([{
      name: data.title + ' Approach',
      description: data.approach
    }]).select();
    const appId = appData ? appData[0].id : null;

    // 3. Insert Insights
    const insightIds = [];
    if (data.insights && data.insights.length > 0) {
      const { data: insData } = await supabaseClient.from('insights').insert(
        data.insights.map(i => ({ project_id: newProject.id, insight_text: i.text, confidence_level: i.confidence }))
      ).select();
      if (insData) insData.forEach(i => insightIds.push(i.id));
    }

    // 4. Insert Questions
    const questionIds = [];
    if (data.open_questions && data.open_questions.length > 0) {
      const { data: qData } = await supabaseClient.from('questions').insert(
        data.open_questions.map(q => ({ project_id: newProject.id, question_text: q.text }))
      ).select();
      if (qData) qData.forEach(q => questionIds.push(q.id));
    }

    // 5. Create Edges
    const edgesToInsert = [];
    
    // Project -> ADDRESSES -> Problem
    if (probId) {
      edgesToInsert.push({ source_node_id: newProject.id, source_type: 'Project', target_node_id: probId, target_type: 'Problem', relationship_type: 'ADDRESSES' });
    }
    // Project -> USES -> Approach
    if (appId) {
      edgesToInsert.push({ source_node_id: newProject.id, source_type: 'Project', target_node_id: appId, target_type: 'Approach', relationship_type: 'USES' });
    }
    // Project -> DISCOVERED -> Insight
    insightIds.forEach(id => {
      edgesToInsert.push({ source_node_id: newProject.id, source_type: 'Project', target_node_id: id, target_type: 'Insight', relationship_type: 'DISCOVERED' });
    });
    // Project -> LEFT_OPEN -> Question
    questionIds.forEach(id => {
      edgesToInsert.push({ source_node_id: newProject.id, source_type: 'Project', target_node_id: id, target_type: 'Question', relationship_type: 'LEFT_OPEN' });
    });
    // Project -> EVOLVED_FROM -> Project (Fork)
    if (data.forked_from) {
      edgesToInsert.push({ source_node_id: newProject.id, source_type: 'Project', target_node_id: data.forked_from, target_type: 'Project', relationship_type: 'EVOLVED_FROM' });
    }

    if (edgesToInsert.length > 0) {
      await supabaseClient.from('edges').insert(edgesToInsert);
    }
    
    // --- END KNOWLEDGE GRAPH ---

    btn.innerHTML = '✓ Submitted!';
    btn.style.background = 'var(--success)';
    setTimeout(() => location.href = 'idea-graph.html', 1500);
  } catch (err) {
    btn.innerHTML = 'Error Submitting';
    btn.style.background = 'var(--danger)';
    console.error("Submit error:", err);
    alert("Submission Error: " + (err.message || JSON.stringify(err)));
    btn.disabled = false;
  }
}



