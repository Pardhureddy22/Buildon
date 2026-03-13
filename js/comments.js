// comments.js — Project discussion system (Supabase)

async function getComments(projectId) {
  const { data, error } = await supabaseClient
    .from('comments')
    .select(`
      id,
      comment_text,
      created_at,
      users ( name )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return data.map(c => {
    // Extract tag if we prepended it
    let text = c.comment_text;
    let tag = '';
    const match = text.match(/^\[(Question|Suggestion|Feedback)\]\s(.*)/);
    if (match) {
      tag = match[1];
      text = match[2];
    }
    return {
      user: c.users?.name || 'Unknown',
      text: text,
      tag: tag,
      date: new Date(c.created_at).toISOString().split('T')[0],
      time: new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  });
}

async function addComment(projectId, userId, text, tag) {
  const finalText = tag ? `[${tag}] ${text}` : text;
  const { error } = await supabaseClient.from('comments').insert([{
    project_id: projectId,
    user_id: userId,
    comment_text: finalText
  }]);
  
  if (error) {
    console.error("Error posting comment:", error);
  }
  return await getComments(projectId);
}

function renderCommentCard(c) {
  const initials = c.user ? c.user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  const tagHtml = c.tag ? `<span class="comment-tag comment-tag-${c.tag.toLowerCase()}">${c.tag}</span>` : '';
  return `<div class="comment-card">
    <div class="comment-avatar">${initials}</div>
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-author">${c.user}</span>
        ${tagHtml}
        <span class="comment-time">${c.date}${c.time ? ' · ' + c.time : ''}</span>
      </div>
      <div class="comment-text">${c.text}</div>
    </div>
  </div>`;
}

async function renderDiscussionTab(projectId, container) {
  const comments = await getComments(projectId);
  const session = await getSession();
  const userName = await getSessionName();
  const userId = await getSessionUserId();

  container.innerHTML = `
    <div class="discussion-input-area">
      <textarea class="form-textarea" id="commentText" placeholder="Ask a question or share insight about this project..." rows="3" ${!session ? 'disabled' : ''}></textarea>
      <div class="discussion-input-footer">
        <div class="comment-tag-selector">
          <button class="comment-tag-btn active" data-tag="">No Tag</button>
          <button class="comment-tag-btn" data-tag="Question">❓ Question</button>
          <button class="comment-tag-btn" data-tag="Suggestion">💡 Suggestion</button>
          <button class="comment-tag-btn" data-tag="Feedback">📝 Feedback</button>
        </div>
        <button class="btn btn-primary" id="postCommentBtn" ${!session ? 'disabled title="Login to comment"' : ''}>Post Comment</button>
      </div>
      ${!session ? '<div style="font-size:12px;color:var(--text-muted);margin-top:8px"><a href="login.html">Login</a> to join the discussion.</div>' : ''}
    </div>
    <div class="comments-list" id="commentsList">
      ${comments.length ? comments.map(c => renderCommentCard(c)).join('') : '<div class="empty-state" style="padding:40px 20px"><div class="empty-state-icon">💬</div><h3>No comments yet</h3><p>Be the first to start the discussion on this project.</p></div>'}
    </div>
  `;

  // Tag selector
  let selectedTag = '';
  container.querySelectorAll('.comment-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.comment-tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTag = btn.dataset.tag;
    });
  });

  // Post comment
  const postBtn = container.querySelector('#postCommentBtn');
  const textArea = container.querySelector('#commentText');
  if (postBtn && session) {
    postBtn.addEventListener('click', async () => {
      const text = textArea.value.trim();
      if (!text) return;
      
      const btnOrig = postBtn.textContent;
      postBtn.textContent = 'Posting...';
      postBtn.disabled = true;

      const newComments = await addComment(projectId, userId, text, selectedTag);
      textArea.value = '';
      
      postBtn.textContent = btnOrig;
      postBtn.disabled = false;

      // Re-render comments list
      container.querySelector('#commentsList').innerHTML = newComments.map(c => renderCommentCard(c)).join('');
    });
  }
}

async function postQuickQuery(projectId, text) {
  const session = await getSession();
  if (!session) { location.href = 'login.html'; return; }
  const userId = await getSessionUserId();
  await addComment(projectId, userId, text, 'Question');
}



