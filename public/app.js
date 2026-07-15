// ==========================================================================
// NOTESHARE FRONTEND APPLICATION ENGINE
// ==========================================================================

// Global App State
const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  notes: [],
  selectedNote: null,
  filters: {
    search: '',
    subject: '',
    tag: ''
  },
  redirectAfterAuth: null
};

// DOM Elements Mapping
const elements = {
  // Navigation & Tabs Links
  btnLogo: document.getElementById('btn-logo'),
  btnCreateNoteTrigger: document.getElementById('btn-create-note-trigger'),
  authActionsLoggedOut: document.getElementById('auth-actions-logged-out'),
  authActionsLoggedIn: document.getElementById('auth-actions-logged-in'),
  btnSigninModal: document.getElementById('btn-signin-modal'),
  btnSignupModal: document.getElementById('btn-signup-modal'),
  userAvatarTrigger: document.getElementById('user-avatar-trigger'),
  userAvatarInitials: document.getElementById('user-avatar-initials'),
  profileDropdown: document.getElementById('profile-dropdown'),
  navUsername: document.getElementById('nav-username'),
  navEmail: document.getElementById('nav-email'),
  btnLogout: document.getElementById('btn-logout'),

  navLinkExplore: document.getElementById('nav-link-explore'),
  navLinkUploads: document.getElementById('nav-link-uploads'),
  navLinkSaved: document.getElementById('nav-link-saved'),
  navLinkAbout: document.getElementById('nav-link-about'),

  // Hero Search & Filters (Explore View)
  searchInput: document.getElementById('search-input'),
  btnSearchGo: document.getElementById('btn-search-go'),
  btnSearchTrigger: document.getElementById('btn-search-trigger'),
  quickFilterTags: document.querySelectorAll('.quick-filters .filter-tag'),

  // Notes Explore Grid
  sectionTitle: document.getElementById('section-title'),
  resultsCount: document.getElementById('results-count'),
  notesLoader: document.getElementById('notes-loader'),
  notesEmpty: document.getElementById('notes-empty'),
  notesGrid: document.getElementById('notes-grid'),

  // My Uploads & Saved Notes Views Grid
  myUploadsGrid: document.getElementById('my-uploads-grid'),
  myUploadsEmpty: document.getElementById('my-uploads-empty'),
  savedNotesGrid: document.getElementById('saved-notes-grid'),
  savedNotesEmpty: document.getElementById('saved-notes-empty'),

  // Sidebar filters (Explore View)
  subjectListFilters: document.getElementById('subject-list-filters'),
  tagsCloudFilters: document.getElementById('tags-cloud-filters'),

  // Auth Modal
  authModal: document.getElementById('auth-modal'),
  btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
  tabSignin: document.getElementById('tab-signin'),
  tabSignup: document.getElementById('tab-signup'),
  formSignin: document.getElementById('form-signin'),
  formSignup: document.getElementById('form-signup'),
  signinUsername: document.getElementById('signin-username'),
  signinPassword: document.getElementById('signin-password'),
  signinError: document.getElementById('signin-error'),
  signupUsername: document.getElementById('signup-username'),
  signupEmail: document.getElementById('signup-email'),
  signupPassword: document.getElementById('signup-password'),
  signupError: document.getElementById('signup-error'),

  // Share Note Form Fields
  formUploadNote: document.getElementById('form-upload-note'),
  noteTitle: document.getElementById('note-title'),
  noteSubject: document.getElementById('note-subject'),
  noteDescription: document.getElementById('note-description'),
  noteTags: document.getElementById('note-tags'),
  noteType: document.getElementById('note-type'),
  sectionNoteText: document.getElementById('section-note-text'),
  sectionNoteFile: document.getElementById('section-note-file'),
  noteContent: document.getElementById('note-content'),
  fileDropArea: document.getElementById('file-drop-area'),
  noteFileInput: document.getElementById('note-file-input'),
  selectedFileBadge: document.getElementById('selected-file-badge'),
  selectedFileName: document.getElementById('selected-file-name'),
  btnRemoveSelectedFile: document.getElementById('btn-remove-selected-file'),
  uploadError: document.getElementById('upload-error'),
  btnSubmitNote: document.getElementById('btn-submit-note'),

  // Note Detail Page Fields
  detailSubject: document.getElementById('detail-subject'),
  detailTagsContainer: document.getElementById('detail-tags-container'),
  detailTitle: document.getElementById('detail-title'),
  detailAuthor: document.getElementById('detail-author'),
  detailDate: document.getElementById('detail-date'),
  detailViews: document.getElementById('detail-views'),
  detailDescription: document.getElementById('detail-description'),
  detailContentText: document.getElementById('detail-content-text'),
  detailContentFile: document.getElementById('detail-content-file'),
  detailFileName: document.getElementById('detail-file-name'),
  btnDownloadFile: document.getElementById('btn-download-file'),
  btnLikeNote: document.getElementById('btn-like-note'),
  likeIconState: document.getElementById('like-icon-state'),
  detailLikesCount: document.getElementById('detail-likes-count'),
  btnDeleteNote: document.getElementById('btn-delete-note'),
  commentsList: document.getElementById('comments-list'),
  commentPromptAuth: document.getElementById('comment-prompt-auth'),
  linkCommentAuth: document.getElementById('link-comment-auth'),
  formComment: document.getElementById('form-comment'),
  commentText: document.getElementById('comment-text')
};

// ==========================================================================
// CORE HELPERS & MARKDOWN PARSER
// ==========================================================================

function parseMarkdown(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italics
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Bullet lists
  html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<li')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

function show(el) { if (el) el.style.display = ''; }
function hide(el) { if (el) el.style.display = 'none'; }
function showView(el) { if (el) el.classList.add('active'); }
function hideView(el) { if (el) el.classList.remove('active'); }

function setButtonLoading(btn, isLoading, originalText) {
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==========================================================================
// ROUTER & NAVIGATION CONTROLLER (SPA)
// ==========================================================================

function handleRoute() {
  const hash = window.location.hash || '#/explore';
  
  // Close user dropdown if open
  elements.profileDropdown.classList.remove('active');

  let path = hash;
  let paramId = null;

  // Regex pattern matching for note detail page, e.g., #/note/abc123xyz
  if (hash.startsWith('#/note/')) {
    path = '#/note/:id';
    paramId = hash.replace('#/note/', '');
  }

  // Route Authentication Guard
  const authRoutes = ['#/my-uploads', '#/saved-notes', '#/share-note'];
  if (authRoutes.includes(path) && !state.user) {
    state.redirectAfterAuth = hash; // Remember destination
    window.location.hash = '#/explore';
    openAuthModal('signin');
    return;
  }

  // Deactivate all views
  document.querySelectorAll('.app-view').forEach(view => hideView(view));

  // Deactivate all navigation menu active highlight classes
  document.querySelectorAll('#main-nav-links .nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // Load target view content
  if (path === '#/explore') {
    showView(document.getElementById('view-explore'));
    elements.navLinkExplore.classList.add('active');
    fetchNotes();
  } else if (path === '#/my-uploads') {
    showView(document.getElementById('view-my-uploads'));
    elements.navLinkUploads.classList.add('active');
    fetchMyUploads();
  } else if (path === '#/saved-notes') {
    showView(document.getElementById('view-saved-notes'));
    elements.navLinkSaved.classList.add('active');
    fetchSavedNotes();
  } else if (path === '#/share-note') {
    showView(document.getElementById('view-share-note'));
  } else if (path === '#/note/:id') {
    showView(document.getElementById('view-note-detail'));
    loadNoteDetails(paramId);
  } else if (path === '#/about') {
    showView(document.getElementById('view-about'));
    elements.navLinkAbout.classList.add('active');
    setupAboutPageListeners();
  } else {
    // Default fallback
    window.location.hash = '#/explore';
  }
}

// Hook router to browser history
window.addEventListener('hashchange', handleRoute);

// ==========================================================================
// SESSION MANAGEMENT
// ==========================================================================

async function checkAuthSession() {
  if (!state.token) {
    updateAuthUI(null);
    return;
  }

  try {
    const data = await request('/api/auth/me');
    updateAuthUI(data.user);
  } catch (err) {
    console.error('Session validation failed:', err.message);
    logout();
  }
}

function updateAuthUI(user) {
  state.user = user;
  if (user) {
    state.token = localStorage.getItem('token');
    
    // Header Avatar
    const initials = user.username.substring(0, 2).toUpperCase();
    elements.userAvatarInitials.textContent = initials;
    elements.navUsername.textContent = user.username;
    elements.navEmail.textContent = user.email;

    // View buttons
    hide(elements.authActionsLoggedOut);
    show(elements.authActionsLoggedIn);
    show(elements.btnCreateNoteTrigger);

    // Dynamic Navigation tabs
    show(elements.navLinkUploads);
    show(elements.navLinkSaved);
    
    // Comments text box enable
    hide(elements.commentPromptAuth);
    show(elements.formComment);
  } else {
    state.user = null;
    state.token = null;
    localStorage.removeItem('token');

    show(elements.authActionsLoggedOut);
    hide(elements.authActionsLoggedIn);
    hide(elements.btnCreateNoteTrigger);

    hide(elements.navLinkUploads);
    hide(elements.navLinkSaved);

    show(elements.commentPromptAuth);
    hide(elements.formComment);
  }
}

function logout() {
  localStorage.removeItem('token');
  updateAuthUI(null);
  elements.profileDropdown.classList.remove('active');
  window.location.hash = '#/explore';
  fetchNotes();
}

// ==========================================================================
// FETCH & RENDER CORE GRID ACTIONS
// ==========================================================================

function renderNotesGridToContainer(notes, container) {
  container.innerHTML = '';
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'glass-card note-card';
    card.addEventListener('click', () => {
      window.location.hash = `#/note/${note.id}`;
    });

    const isLiked = state.user && note.likes && note.likes.includes(state.user.id);
    const likeIcon = isLiked ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart';
    const noteIcon = note.fileType === 'file' ? 'fa-regular fa-file-pdf' : 'fa-regular fa-file-lines';

    card.innerHTML = `
      <div class="note-card-body">
        <div class="note-card-header">
          <span class="badge badge-subject">${escapeHTML(note.subject)}</span>
          <i class="${noteIcon} note-type-indicator"></i>
        </div>
        <h3>${escapeHTML(note.title)}</h3>
        <p class="note-card-desc">${escapeHTML(note.description || 'No description provided.')}</p>
      </div>
      <div class="note-card-footer">
        <span class="note-author"><i class="fa-solid fa-circle-user"></i> ${escapeHTML(note.author)}</span>
        <div class="note-stats">
          <span><i class="fa-regular fa-eye"></i> ${note.views || 0}</span>
          <span class="${isLiked ? 'liked' : ''}"><i class="${likeIcon}"></i> ${note.likes ? note.likes.length : 0}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// 1. Fetch Explore Dashboard Notes
async function fetchNotes() {
  show(elements.notesLoader);
  hide(elements.notesEmpty);
  elements.notesGrid.innerHTML = '';

  try {
    const params = new URLSearchParams();
    if (state.filters.search) params.append('search', state.filters.search);
    if (state.filters.subject) params.append('subject', state.filters.subject);
    if (state.filters.tag) params.append('tag', state.filters.tag);

    const data = await request(`/api/notes?${params.toString()}`);
    state.notes = data.notes;
    
    elements.resultsCount.textContent = `${data.notes.length} note${data.notes.length === 1 ? '' : 's'} shared`;

    if (data.notes.length === 0) {
      show(elements.notesEmpty);
    } else {
      renderNotesGridToContainer(data.notes, elements.notesGrid);
    }
    
    renderSidebarFilters(data.notes);
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    elements.notesGrid.innerHTML = `<p class="text-danger">Failed to load notes. Please refresh.</p>`;
  } finally {
    hide(elements.notesLoader);
  }
}

// 2. Fetch User Uploaded Notes
async function fetchMyUploads() {
  const grid = elements.myUploadsGrid;
  const empty = elements.myUploadsEmpty;
  grid.innerHTML = `<div class="loader-container"><div class="spinner"></div><p>Loading your uploads...</p></div>`;
  hide(empty);

  try {
    const data = await request(`/api/notes?userId=${state.user.id}`);
    grid.innerHTML = '';
    
    if (data.notes.length === 0) {
      show(empty);
    } else {
      renderNotesGridToContainer(data.notes, grid);
    }
  } catch (err) {
    grid.innerHTML = `<p class="text-danger">Failed to load contributions: ${err.message}</p>`;
  }
}

// 3. Fetch User Liked Notes
async function fetchSavedNotes() {
  const grid = elements.savedNotesGrid;
  const empty = elements.savedNotesEmpty;
  grid.innerHTML = `<div class="loader-container"><div class="spinner"></div><p>Loading saved notes...</p></div>`;
  hide(empty);

  try {
    const data = await request(`/api/notes?likedBy=${state.user.id}`);
    grid.innerHTML = '';
    
    if (data.notes.length === 0) {
      show(empty);
    } else {
      renderNotesGridToContainer(data.notes, grid);
    }
  } catch (err) {
    grid.innerHTML = `<p class="text-danger">Failed to load saved notes: ${err.message}</p>`;
  }
}

// ==========================================================================
// EXPLORE SIDEBAR SUBJECTS & TAG CLOUD RENDERING
// ==========================================================================

function renderSidebarFilters(notes) {
  // Subjects
  const subjectsMap = {};
  state.notes.forEach(n => {
    subjectsMap[n.subject] = (subjectsMap[n.subject] || 0) + 1;
  });

  elements.subjectListFilters.innerHTML = `
    <li class="subject-item ${state.filters.subject === '' ? 'active' : ''}" data-subject="">
      <span>All Subjects</span>
      <span class="subject-count">${state.notes.length}</span>
    </li>
  `;

  Object.entries(subjectsMap).forEach(([subj, count]) => {
    const li = document.createElement('li');
    li.className = `subject-item ${state.filters.subject.toLowerCase() === subj.toLowerCase() ? 'active' : ''}`;
    li.dataset.subject = subj;
    li.innerHTML = `
      <span>${escapeHTML(subj)}</span>
      <span class="subject-count">${count}</span>
    `;
    li.addEventListener('click', () => setSubjectFilter(subj));
    elements.subjectListFilters.appendChild(li);
  });

  elements.subjectListFilters.firstElementChild.addEventListener('click', () => setSubjectFilter(''));

  // Tags Cloud
  const tagsSet = new Set();
  state.notes.forEach(n => {
    if (n.tags) n.tags.forEach(t => tagsSet.add(t));
  });

  elements.tagsCloudFilters.innerHTML = '';
  if (tagsSet.size === 0) {
    elements.tagsCloudFilters.innerHTML = '<span class="text-dark" style="font-size: 0.85rem">No tags available</span>';
    return;
  }

  tagsSet.forEach(tag => {
    const span = document.createElement('span');
    span.className = `tag-badge ${state.filters.tag.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`;
    span.textContent = `#${tag}`;
    span.addEventListener('click', () => {
      setTagFilter(state.filters.tag.toLowerCase() === tag.toLowerCase() ? '' : tag);
    });
    elements.tagsCloudFilters.appendChild(span);
  });
}

function setSubjectFilter(subj) {
  state.filters.subject = subj;
  elements.sectionTitle.textContent = subj ? `Notes for ${subj}` : 'Explore Shared Notes';

  elements.quickFilterTags.forEach(btn => {
    if (btn.dataset.subject.toLowerCase() === subj.toLowerCase()) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  fetchNotes();
}

function setTagFilter(tag) {
  state.filters.tag = tag;
  fetchNotes();
}

// ==========================================================================
// UPLOAD NOTE SUBMISSION WORKSPACE
// ==========================================================================

let selectedFile = null;

elements.noteFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleSelectedFile(e.target.files[0]);
  }
});

elements.fileDropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.fileDropArea.classList.add('dragover');
});

elements.fileDropArea.addEventListener('dragleave', () => {
  elements.fileDropArea.classList.remove('dragover');
});

elements.fileDropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.fileDropArea.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleSelectedFile(e.dataTransfer.files[0]);
  }
});

function handleSelectedFile(file) {
  selectedFile = file;
  elements.selectedFileName.textContent = file.name;
  hide(elements.fileDropArea);
  show(elements.selectedFileBadge);
}

elements.btnRemoveSelectedFile.addEventListener('click', () => {
  selectedFile = null;
  elements.noteFileInput.value = '';
  show(elements.fileDropArea);
  hide(elements.selectedFileBadge);
});

elements.noteType.addEventListener('change', (e) => {
  if (e.target.value === 'file') {
    hide(elements.sectionNoteText);
    show(elements.sectionNoteFile);
  } else {
    show(elements.sectionNoteText);
    hide(elements.sectionNoteFile);
  }
});

elements.formUploadNote.addEventListener('submit', async (e) => {
  e.preventDefault();
  hide(elements.uploadError);

  const title = elements.noteTitle.value.trim();
  const subject = elements.noteSubject.value.trim();
  const description = elements.noteDescription.value.trim();
  const tags = elements.noteTags.value.split(',').map(t => t.trim()).filter(Boolean);
  const fileType = elements.noteType.value;

  if (!title || !subject) {
    showError(elements.uploadError, 'Title and Subject are required');
    return;
  }

  const submitBtn = elements.btnSubmitNote;
  setButtonLoading(submitBtn, true, 'Share Note');

  try {
    if (fileType === 'file') {
      if (!selectedFile) throw new Error('Please upload a file');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('description', description);
      formData.append('tags', JSON.stringify(tags));
      formData.append('fileType', 'file');
      formData.append('file', selectedFile);

      const headers = {};
      if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
      }
      
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers,
        body: formData
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to upload note');
    } else {
      const content = elements.noteContent.value.trim();
      if (!content) throw new Error('Please write some content for your text note');

      await request('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          subject,
          description,
          tags,
          fileType: 'text',
          content
        })
      });
    }

    // Success - Clear form and redirect
    elements.formUploadNote.reset();
    selectedFile = null;
    elements.noteFileInput.value = '';
    show(elements.fileDropArea);
    hide(elements.selectedFileBadge);
    
    state.filters = { search: '', subject: '', tag: '' };
    elements.searchInput.value = '';
    
    // Redirect to Explore
    window.location.hash = '#/explore';
  } catch (err) {
    showError(elements.uploadError, err.message);
  } finally {
    setButtonLoading(submitBtn, false, 'Share Note');
  }
});

// ==========================================================================
// NOTE DETAIL READER VIEW
// ==========================================================================

async function loadNoteDetails(noteId) {
  try {
    const data = await request(`/api/notes/${noteId}`);
    const note = data.note;
    state.selectedNote = note;

    // Fill elements
    elements.detailTitle.textContent = note.title;
    elements.detailSubject.textContent = note.subject;
    elements.detailAuthor.textContent = note.author;
    elements.detailDate.textContent = formatDate(note.createdAt);
    elements.detailViews.textContent = `${note.views || 0} view${note.views === 1 ? '' : 's'}`;
    elements.detailDescription.textContent = note.description || 'No description provided.';
    elements.detailLikesCount.textContent = note.likes ? note.likes.length : 0;

    // Tags
    elements.detailTagsContainer.innerHTML = '';
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach(t => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-subject';
        badge.textContent = `#${t}`;
        elements.detailTagsContainer.appendChild(badge);
      });
    }

    updateLikeButtonUI(note);

    // Delete permissions
    if (state.user && state.user.id === note.userId) {
      show(elements.btnDeleteNote);
    } else {
      hide(elements.btnDeleteNote);
    }

    // Text Content vs File Downloader
    if (note.fileType === 'file') {
      hide(elements.detailContentText);
      show(elements.detailContentFile);
      elements.detailFileName.textContent = note.fileName || 'Shared Document';
      elements.btnDownloadFile.href = `/${note.filePath}`;
    } else {
      hide(elements.detailContentFile);
      show(elements.detailContentText);
      elements.detailContentText.innerHTML = parseMarkdown(note.content);
    }

    fetchComments(noteId);
  } catch (err) {
    alert(`Failed to load note details: ${err.message}`);
    window.location.hash = '#/explore';
  }
}

function updateLikeButtonUI(note) {
  const isLiked = state.user && note.likes && note.likes.includes(state.user.id);
  if (isLiked) {
    elements.btnLikeNote.classList.add('active');
    elements.likeIconState.className = 'fa-solid fa-heart';
  } else {
    elements.btnLikeNote.classList.remove('active');
    elements.likeIconState.className = 'fa-regular fa-heart';
  }
}

async function handleLikeToggle() {
  if (!state.user) {
    openAuthModal('signin');
    return;
  }

  const note = state.selectedNote;
  if (!note) return;

  try {
    const data = await request(`/api/notes/${note.id}/like`, { method: 'POST' });
    
    if (data.liked) {
      if (!note.likes.includes(state.user.id)) note.likes.push(state.user.id);
    } else {
      note.likes = note.likes.filter(id => id !== state.user.id);
    }
    
    elements.detailLikesCount.textContent = data.likesCount;
    updateLikeButtonUI(note);
  } catch (err) {
    console.error('Like toggle failed:', err.message);
  }
}

async function handleDeleteNote() {
  const note = state.selectedNote;
  if (!note || !confirm('Are you absolutely sure you want to delete this note? This action cannot be undone.')) return;

  try {
    await request(`/api/notes/${note.id}`, { method: 'DELETE' });
    window.location.hash = '#/explore';
  } catch (err) {
    alert(`Failed to delete note: ${err.message}`);
  }
}

// Comments
async function fetchComments(noteId) {
  elements.commentsList.innerHTML = `<div class="loader-container"><div class="spinner" style="width:24px; height:24px;"></div></div>`;
  try {
    const data = await request(`/api/notes/${noteId}/comments`);
    renderComments(data.comments);
  } catch (err) {
    elements.commentsList.innerHTML = '<p class="text-danger" style="font-size:0.8rem">Failed to load comments.</p>';
  }
}

function renderComments(comments) {
  elements.commentsList.innerHTML = '';
  if (comments.length === 0) {
    elements.commentsList.innerHTML = '<p class="text-dark" style="font-size:0.88rem; padding: 10px 0;">No comments yet. Start the conversation!</p>';
    return;
  }

  comments.forEach(c => {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item';
    commentItem.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${escapeHTML(c.author)}</span>
        <span class="comment-date">${formatDate(c.createdAt)}</span>
      </div>
      <p class="comment-content">${escapeHTML(c.content)}</p>
    `;
    elements.commentsList.appendChild(commentItem);
  });
  elements.commentsList.scrollTop = elements.commentsList.scrollHeight;
}

elements.formComment.addEventListener('submit', async (e) => {
  e.preventDefault();
  const note = state.selectedNote;
  const content = elements.commentText.value.trim();

  if (!note || !content) return;

  try {
    await request(`/api/notes/${note.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    elements.commentText.value = '';
    fetchComments(note.id);
  } catch (err) {
    alert(`Failed to post comment: ${err.message}`);
  }
});

// ==========================================================================
// AUTH SIGNIN / SIGNUP
// ==========================================================================

function openAuthModal(tab = 'signin') {
  hide(elements.signinError);
  hide(elements.signupError);
  elements.authModal.classList.add('active');
  switchAuthTab(tab);
}

function switchAuthTab(tab) {
  if (tab === 'signin') {
    elements.tabSignin.classList.add('active');
    elements.tabSignup.classList.remove('active');
    elements.formSignin.classList.add('active');
    elements.formSignup.classList.remove('active');
  } else {
    elements.tabSignup.classList.add('active');
    elements.tabSignin.classList.remove('active');
    elements.formSignup.classList.add('active');
    elements.formSignin.classList.remove('active');
  }
}

elements.tabSignin.addEventListener('click', () => switchAuthTab('signin'));
elements.tabSignup.addEventListener('click', () => switchAuthTab('signup'));

elements.formSignin.addEventListener('submit', async (e) => {
  e.preventDefault();
  hide(elements.signinError);

  const username = elements.signinUsername.value.trim();
  const password = elements.signinPassword.value;

  const btn = elements.formSignin.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, 'Sign In');

  try {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    localStorage.setItem('token', data.token);
    updateAuthUI(data.user);
    closeModals();
    elements.formSignin.reset();

    // Redirect or Refresh
    if (state.redirectAfterAuth) {
      const destination = state.redirectAfterAuth;
      state.redirectAfterAuth = null;
      window.location.hash = destination;
    } else {
      handleRoute();
    }
  } catch (err) {
    showError(elements.signinError, err.message);
  } finally {
    setButtonLoading(btn, false, 'Sign In');
  }
});

elements.formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  hide(elements.signupError);

  const username = elements.signupUsername.value.trim();
  const email = elements.signupEmail.value.trim();
  const password = elements.signupPassword.value;

  const btn = elements.formSignup.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, 'Create Account');

  try {
    const data = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    localStorage.setItem('token', data.token);
    updateAuthUI(data.user);
    closeModals();
    elements.formSignup.reset();

    if (state.redirectAfterAuth) {
      const destination = state.redirectAfterAuth;
      state.redirectAfterAuth = null;
      window.location.hash = destination;
    } else {
      handleRoute();
    }
  } catch (err) {
    showError(elements.signupError, err.message);
  } finally {
    setButtonLoading(btn, false, 'Create Account');
  }
});

function showError(container, text) {
  container.textContent = text;
  show(container);
}

function closeModals() {
  elements.authModal.classList.remove('active');
}

elements.btnCloseAuthModal.addEventListener('click', closeModals);
elements.authModal.addEventListener('click', (e) => {
  if (e.target === elements.authModal) closeModals();
});

// ==========================================================================
// ABOUT ACCORDION FAQs MODULE
// ==========================================================================

let aboutListenersInitialized = false;
function setupAboutPageListeners() {
  if (aboutListenersInitialized) return;
  
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
  
  aboutListenersInitialized = true;
}

// ==========================================================================
// SEARCH INPUT & FILTERS
// ==========================================================================

function handleSearch() {
  const query = elements.searchInput.value.trim();
  state.filters.search = query;
  
  // If not currently on Explore, redirect there to display search results
  if (window.location.hash !== '#/explore' && window.location.hash !== '') {
    window.location.hash = '#/explore';
  } else {
    fetchNotes();
  }
}

elements.btnSearchGo.addEventListener('click', handleSearch);
elements.searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});
elements.searchInput.addEventListener('input', (e) => {
  if (e.target.value.trim() === '') {
    handleSearch();
  }
});
elements.btnSearchTrigger.addEventListener('click', () => {
  if (window.location.hash !== '#/explore' && window.location.hash !== '') {
    window.location.hash = '#/explore';
  }
  setTimeout(() => {
    elements.searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements.searchInput.focus();
  }, 100);
});

elements.quickFilterTags.forEach(btn => {
  btn.addEventListener('click', () => {
    const subj = btn.dataset.subject;
    setSubjectFilter(subj);
  });
});

elements.userAvatarTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  elements.profileDropdown.classList.toggle('active');
});

document.addEventListener('click', () => {
  elements.profileDropdown.classList.remove('active');
});

elements.btnSigninModal.addEventListener('click', () => openAuthModal('signin'));
elements.btnSignupModal.addEventListener('click', () => openAuthModal('signup'));
elements.linkCommentAuth.addEventListener('click', (e) => {
  e.preventDefault();
  openAuthModal('signin');
});

elements.btnLikeNote.addEventListener('click', handleLikeToggle);
elements.btnDeleteNote.addEventListener('click', handleDeleteNote);
elements.btnLogout.addEventListener('click', logout);

// Initialize Application routing
document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
  handleRoute();
});
