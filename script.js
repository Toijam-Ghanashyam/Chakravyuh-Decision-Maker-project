// Supabase configuration — replace with your values
const SUPABASE_URL = 'https://ckeubdntzjjjzzmmaqpk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_-D98j_YQZCkxgkqq2l9hFA_RZibPwXP'

// Initialize Supabase client (requires the CDN script in index.html)
const supabaseClient = typeof supabase !== 'undefined'
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// Fallback/mock decision data used only when Supabase is unavailable
const mockDecisions = [
  { id: 1, title: "Market Entry Strategy", category: "Strategic", date: "2025-01-07" },
  { id: 2, title: "Product Roadmap Q2", category: "Product", date: "2025-01-06" },
  { id: 3, title: "Infrastructure Migration", category: "Technical", date: "2025-01-05" },
  { id: 4, title: "Team Expansion Plan", category: "HR", date: "2025-01-04" },
  { id: 5, title: "Budget Allocation Meeting", category: "Finance", date: "2025-01-03" },
  { id: 6, title: "Risk Assessment Review", category: "Risk", date: "2025-01-02" },
]

const viewTitles = {
  dashboard: { title: "Dashboard Overview", subtitle: "Your decision intelligence hub" },
  "ai-insights": { title: "AI Chat Assistant", subtitle: "Conversational decision support" },
  "memory-archive": { title: "Memory Archive", subtitle: "Historical decision timeline" },
  "add-decision": { title: "Add New Decision", subtitle: "Record a new decision" },
  "team-workspace": { title: "Team Workspace", subtitle: "Collaborative decision making" },
  documentation: { title: "Documentation", subtitle: "Guides and resources" },
  settings: { title: "Settings", subtitle: "Application preferences" },
}

// State management
let isLoggedIn = false
let activeView = "dashboard"
let isDarkMode = true
let searchQuery = ""

// DOM Elements
const loginPage = document.getElementById("loginPage")
const dashboard = document.getElementById("dashboard")
const loginForm = document.getElementById("loginForm")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const sidebar = document.getElementById("sidebar")
const logoutBtn = document.getElementById("logoutBtn")
const themeToggle = document.getElementById("themeToggle")
const searchInput = document.getElementById("searchInput")
const clearSearchBtn = document.getElementById("clearSearchBtn")
const searchResults = document.getElementById("searchResults")
const searchBackdrop = document.getElementById("searchBackdrop")
const pageTitle = document.getElementById("pageTitle")
const pageSubtitle = document.getElementById("pageSubtitle")
const searchResultsList = document.getElementById("searchResultsList")
const signupForm = document.getElementById('signupForm')
const signupName = document.getElementById('signupName')
const signupEmail = document.getElementById('signupEmail')
const signupPassword = document.getElementById('signupPassword')
const showSignupBtn = document.getElementById('showSignupBtn')
const showLoginBtn = document.getElementById('showLoginBtn')
const currentUserDisplay = document.getElementById('currentUser')
const addDecisionForm = document.getElementById('addDecisionForm')
const decisionTitle = document.getElementById('decisionTitle')
const decisionDescription = document.getElementById('decisionDescription')
const decisionCategory = document.getElementById('decisionCategory')
const decisionDate = document.getElementById('decisionDate')
const decisionNotes = document.getElementById('decisionNotes')
const decisionFiles = document.getElementById('decisionFiles')
const addDecisionMessage = document.getElementById('addDecisionMessage')
// Memory archive filter
const archiveCategoryFilter = document.getElementById('archiveCategoryFilter')

const chatMessages = document.getElementById('chatMessages')
const chatInput = document.getElementById('chatInput')
const chatSend = document.getElementById('chatSend')
const teamMemberEmail = document.getElementById('teamMemberEmail')
const addTeamMemberBtn = document.getElementById('addTeamMemberBtn')
const teamMembersList = document.getElementById('teamMembersList')

// In-memory containers
window.teamMembers = window.teamMembers || []
window.chatHistory = window.chatHistory || []

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners()
  loadThemePreference()
  initAuth()
  renderDashboardStats()
  renderTeamMembers()
  renderRecentDecisions()
  
  // Show welcome message in chat if chat is empty
  if (chatMessages && chatMessages.children.length === 0) {
    showWelcomeMessage()
  }
  
  // Clear chat UI when page is actually unloading (but keep database)
  // Using visibilitychange to detect when user closes tab/window
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is being hidden (user switching tabs or closing)
      // Clear chat UI but keep database
      if (chatMessages) {
        chatMessages.innerHTML = ''
      }
    }
  })
  
  // Also clear on beforeunload for immediate close
  window.addEventListener('beforeunload', () => {
    if (chatMessages) {
      chatMessages.innerHTML = ''
    }
  })
})

function initializeEventListeners() {
  // Login
  loginForm.addEventListener("submit", handleLogin)
  if (signupForm) signupForm.addEventListener('submit', handleSignup)
  if (showSignupBtn) showSignupBtn.addEventListener('click', showSignup)
  if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin)

  // Add Decision Form
  if (addDecisionForm) addDecisionForm.addEventListener('submit', handleAddDecision)

  // Chat
  if (chatSend) chatSend.addEventListener('click', handleSendMessage)
  if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage() } })

  // Team workspace
  if (addTeamMemberBtn) addTeamMemberBtn.addEventListener('click', handleAddTeamMember)

  // Archive filter
  if (archiveCategoryFilter) archiveCategoryFilter.addEventListener('change', renderMemoryArchive)

  // Logout
  logoutBtn.addEventListener("click", handleLogout)

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme)

  // Sidebar navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      const view = e.currentTarget.dataset.view
      if (view) switchView(view)
    })
  })

  // Search
  searchInput.addEventListener("input", handleSearch)
  searchInput.addEventListener("focus", handleSearchFocus)
  clearSearchBtn.addEventListener("click", handleClearSearch)
  searchBackdrop.addEventListener("click", closeSearch)
}

// ========== LOGIN LOGIC ==========
async function handleLogin(e) {
  e.preventDefault()

  const email = emailInput.value.trim()
  const password = passwordInput.value

  if (!email || !password) return

  if (!supabaseClient) {
    // If Supabase is not configured, fallback to mock login
    isLoggedIn = true
    loginPage.classList.remove("active")
    dashboard.classList.add("active")
    loginForm.reset()
    window.decisions = mockDecisions
    return
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Login error', error)
    alert(error.message || 'Login failed')
    return
  }

  isLoggedIn = true
  loginPage.classList.remove("active")
  dashboard.classList.add("active")
  loginForm.reset()

  await loadDecisions()
  await refreshUser()
}

// ====== SIGNUP LOGIC ======
async function handleSignup(e) {
  e.preventDefault()

  const name = signupName ? signupName.value.trim() : ''
  const email = signupEmail ? signupEmail.value.trim() : ''
  const password = signupPassword ? signupPassword.value : ''

  if (!email || !password) return

  if (!supabaseClient) {
    // local fallback: create a mock user and sign in
    isLoggedIn = true
    loginPage.classList.remove('active')
    dashboard.classList.add('active')
    window.decisions = mockDecisions
    signupForm.style.display = 'none'
    showSignupBtn.style.display = ''
    showLoginBtn.style.display = 'none'
    return
  }

  // Create user
  const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name } } })

  if (signUpError) {
    console.error('Signup error', signUpError)
    alert(signUpError.message || 'Signup failed')
    return
  }

  // Try to sign in immediately (works if email confirmations are not required)
  const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password })
  if (signInError) {
    // If sign-in fails because confirmation required, inform the user
    console.warn('Sign-in after signup failed', signInError)
    alert('Account created. Please check your email to confirm your account before signing in.')
    // Switch back to login form
    showLogin()
    return
  }

  isLoggedIn = true
  loginPage.classList.remove('active')
  dashboard.classList.add('active')
  signupForm.reset()
  await loadDecisions()
  await refreshUser()
}

function showSignup() {
  if (loginForm) loginForm.style.display = 'none'
  if (signupForm) signupForm.style.display = ''
  if (showSignupBtn) showSignupBtn.style.display = 'none'
  if (showLoginBtn) showLoginBtn.style.display = ''
}

function showLogin() {
  if (loginForm) loginForm.style.display = ''
  if (signupForm) signupForm.style.display = 'none'
  if (showSignupBtn) showSignupBtn.style.display = ''
  if (showLoginBtn) showLoginBtn.style.display = 'none'
}

// ====== AUTH SESSION HANDLING & UI ======
async function refreshUser() {
  if (!supabaseClient || !currentUserDisplay) return

  try {
    const { data, error } = await supabaseClient.auth.getUser()
    if (error) {
      console.error('getUser error', error)
    }

    const user = data?.user || null
    if (user) {
      currentUserDisplay.textContent = user.email || user.user_metadata?.full_name || 'Signed in'
      currentUserDisplay.style.display = ''
      if (logoutBtn) logoutBtn.style.display = ''
    } else {
      currentUserDisplay.textContent = ''
      currentUserDisplay.style.display = 'none'
      if (logoutBtn) logoutBtn.style.display = 'none'
    }
  } catch (err) {
    console.error('refreshUser error', err)
  }
}

function initAuth() {
  if (!supabaseClient) return

  // Update UI with current user (if any)
  refreshUser()

  // If there's an active session, load team members and chat history
  ;(async () => {
    try {
      const { data } = await supabaseClient.auth.getUser()
      const user = data?.user
      if (user) {
        await loadTeamMembers()
        await loadChatHistory()
      }
    } catch (e) {
      // ignore
    }
  })()

  // Listen to auth changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    // event values: "SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", etc.
    if (event === 'SIGNED_OUT') {
      isLoggedIn = false
      window.decisions = []
    }
    if (event === 'SIGNED_IN') {
      isLoggedIn = true
    }
    refreshUser()
    // when auth state changes, reload team members and chat history
    if (event === 'SIGNED_IN') {
      loadTeamMembers()
      loadChatHistory()
    }
  })
}

// API key storage removed — Edge Function handles the Gemini API key securely.

async function loadChatHistory() {
  // Don't load chat history from database - show welcome message instead
  // Chat history is kept in database but UI is cleared on each visit for a fresh start
  if (chatMessages && chatMessages.children.length === 0) {
    showWelcomeMessage()
  }
}

function handleLogout() {
  ;(async () => {
    if (supabaseClient) await supabaseClient.auth.signOut()
    isLoggedIn = false
    loginPage.classList.add("active")
    dashboard.classList.remove("active")

    // Reset state
    activeView = "dashboard"
    searchQuery = ""
    closeSearch()
    window.decisions = []
  })()
}

// ========== THEME LOGIC ==========
function toggleTheme() {
  isDarkMode = !isDarkMode
  updateTheme()
  localStorage.setItem("isDarkMode", isDarkMode)
}

function updateTheme() {
  const html = document.documentElement

  if (isDarkMode) {
    html.style.removeProperty("filter")
    document.body.classList.remove("light-mode")
  } else {
    document.body.classList.add("light-mode")
  }

  updateThemeIcon()
}

function updateThemeIcon() {
  themeToggle.innerHTML = isDarkMode ? '<span class="icon">☀️</span>' : '<span class="icon">🌙</span>'
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem("isDarkMode")
  if (savedTheme !== null) {
    isDarkMode = savedTheme === "true"
  }
  updateTheme()
}

// ========== VIEW SWITCHING ==========
function switchView(viewName) {
  // Update active navigation item
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active")
    if (item.dataset.view === viewName) {
      item.classList.add("active")
    }
  })

  // Hide all views
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active")
  })

  // Show selected view
  const viewElement = document.getElementById(`${viewName}-view`)
  if (viewElement) {
    viewElement.classList.add("active")
  }

  // Update page title and subtitle
  const viewInfo = viewTitles[viewName]
  if (viewInfo) {
    pageTitle.textContent = viewInfo.title
    pageSubtitle.textContent = viewInfo.subtitle
  }

  activeView = viewName
  closeSearch()
  
  // Show welcome message when switching to AI chat view
  if (viewName === 'ai-insights' && chatMessages && chatMessages.children.length === 0) {
    showWelcomeMessage()
  }
  
  // Render dynamic content for certain views
  if (viewName === 'memory-archive') renderMemoryArchive()
  if (viewName === 'dashboard') renderDashboardStats()
}

// ========== SEARCH LOGIC ==========
function handleSearch(e) {
  searchQuery = e.target.value.trim()

  if (searchQuery.length > 0) {
    clearSearchBtn.classList.add("visible")
    displaySearchResults()
    searchResults.classList.remove("hidden")
    searchBackdrop.classList.remove("hidden")
  } else {
    clearSearchBtn.classList.remove("visible")
    searchResults.classList.add("hidden")
    searchBackdrop.classList.add("hidden")
  }
}

function handleSearchFocus() {
  if (searchQuery.length > 0) {
    searchResults.classList.remove("hidden")
    searchBackdrop.classList.remove("hidden")
  }
}

function handleClearSearch() {
  searchQuery = ""
  searchInput.value = ""
  clearSearchBtn.classList.remove("visible")
  searchResults.classList.add("hidden")
  searchBackdrop.classList.add("hidden")
}

function displaySearchResults() {
  searchResultsList.innerHTML = ''

  const q = searchQuery
  if (!q) {
    searchResultsList.innerHTML = '<div class="search-results-empty">Type to search decisions</div>'
    return
  }

  // If Supabase client is available, search server-side for best results
  if (supabaseClient) {
    ;(async () => {
      const pattern = `%${q}%`
      const { data, error } = await supabaseClient
        .from('decisions')
        .select('*')
        .or(`title.ilike.${pattern},category.ilike.${pattern}`)
        .order('date', { ascending: false })

      if (error) {
        console.error('Search error', error)
        searchResultsList.innerHTML = '<div class="search-results-empty">No decisions found</div>'
        return
      }

      if (!data || data.length === 0) {
        searchResultsList.innerHTML = '<div class="search-results-empty">No decisions found</div>'
        return
      }

      data.forEach((decision) => {
        const item = document.createElement('button')
        item.className = 'search-result-item'
        item.type = 'button'
        item.innerHTML = `
          <div class="search-result-title">${decision.title}</div>
          <div class="search-result-meta">
            <span class="search-result-category">${decision.category || ''}</span>
            <span class="search-result-date">${decision.date || ''}</span>
          </div>
        `
        item.addEventListener('click', () => {
          searchQuery = ''
          searchInput.value = ''
          closeSearch()
          console.log('Navigate to decision:', decision.id)
        })
        searchResultsList.appendChild(item)
      })
    })()
    return
  }

  // Fallback: client-side filter from mockDecisions or previously loaded decisions
  const pool = window.decisions && window.decisions.length ? window.decisions : mockDecisions
  const filteredDecisions = pool.filter((decision) =>
    (decision.title || '').toLowerCase().includes(q.toLowerCase()) ||
    (decision.category || '').toLowerCase().includes(q.toLowerCase()),
  )

  if (filteredDecisions.length > 0) {
    filteredDecisions.forEach((decision) => {
      const item = document.createElement('button')
      item.className = 'search-result-item'
      item.type = 'button'
      item.innerHTML = `
        <div class="search-result-title">${decision.title}</div>
        <div class="search-result-meta">
          <span class="search-result-category">${decision.category || ''}</span>
          <span class="search-result-date">${decision.date || ''}</span>
        </div>
      `
      item.addEventListener('click', () => {
        searchQuery = ''
        searchInput.value = ''
        closeSearch()
        console.log('Navigate to decision:', decision.id)
      })
      searchResultsList.appendChild(item)
    })
  } else {
    searchResultsList.innerHTML = '<div class="search-results-empty">No decisions found</div>'
  }
}

// Load decisions from Supabase into window.decisions (or fallback to mock data)
async function loadDecisions() {
  if (!supabaseClient) {
    window.decisions = mockDecisions
    return
  }

  const { data, error } = await supabaseClient
    .from('decisions')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Failed to load decisions', error)
    window.decisions = mockDecisions
    return
  }

  window.decisions = data || []

  // Load attached documents (if any) and attach them to decisions
  try {
    const decisionIds = (window.decisions || []).map(d => d.id).filter(Boolean)
    if (decisionIds.length > 0) {
      const { data: docs, error: docsError } = await supabaseClient
        .from('decision_documents')
        .select('*')
        .in('decision_id', decisionIds)

      if (docsError) {
        console.warn('Failed to load decision documents', docsError)
      } else {
        // Map docs to decisions
        const docsByDecision = {}
        ;(docs || []).forEach(doc => {
          if (!docsByDecision[doc.decision_id]) docsByDecision[doc.decision_id] = []
          docsByDecision[doc.decision_id].push(doc)
        })
        window.decisions = (window.decisions || []).map(d => ({ ...(d || {}), documents: docsByDecision[d.id] || [] }))
      }
    }
  } catch (e) {
    console.warn('Error attaching documents to decisions', e)
  }

  // Update UI after loading
  try { 
    renderDashboardStats()
    renderMemoryArchive()
    renderRecentDecisions()
  } catch (e) { /* ignore */ }
}

// ====== RENDER / UI HELPERS ======
function renderDashboardStats() {
  const decisions = window.decisions || []
  const total = decisions.length
  const now = new Date()
  const thisMonth = decisions.filter(d => {
    if (!d.date) return false
    const dt = new Date(d.date)
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  }).length
  const today = new Date()
  const pending = decisions.filter(d => {
    if (!d.date) return false
    const dt = new Date(d.date)
    return dt > today
  }).length
  const teamCount = (window.teamMembers && window.teamMembers.length) || 0

  const totalEl = document.getElementById('totalDecisions')
  const thisMonthEl = document.getElementById('thisMonthCount')
  const pendingEl = document.getElementById('pendingReviewCount')
  const teamEl = document.getElementById('teamMembersCount')

  if (totalEl) totalEl.textContent = total
  if (thisMonthEl) thisMonthEl.textContent = thisMonth
  if (pendingEl) pendingEl.textContent = pending
  if (teamEl) teamEl.textContent = teamCount
}

function renderMemoryArchive() {
  const container = document.getElementById('memoryArchiveList')
  if (!container) return
  container.innerHTML = ''
  let decisions = (window.decisions || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date))

  const selectedCategory = (archiveCategoryFilter && archiveCategoryFilter.value) ? archiveCategoryFilter.value : ''
  if (selectedCategory) {
    decisions = decisions.filter(d => (d.category || '') === selectedCategory)
  }

  if (decisions.length === 0) {
    container.innerHTML = '<div class="search-results-empty">No decisions yet</div>'
    return
  }

  decisions.forEach(d => {
    const item = document.createElement('div')
    item.className = 'archive-item'
    const title = document.createElement('h4')
    title.textContent = d.title || 'Untitled'
    const date = document.createElement('p')
    date.className = 'date'
    date.textContent = d.date ? new Date(d.date).toLocaleDateString() : ''
    const meta = document.createElement('div')
    meta.style.marginTop = '0.5rem'
    meta.style.fontSize = '0.9rem'
    meta.style.color = 'var(--text-tertiary)'
    meta.textContent = d.category ? d.category : ''

    // Description
    if (d.description) {
      const desc = document.createElement('p')
      desc.style.marginTop = '0.5rem'
      desc.style.color = 'var(--text-secondary)'
      desc.textContent = d.description
      item.appendChild(desc)
    }

    // Notes fallback
    if (d.notes) {
      const notes = document.createElement('p')
      notes.style.marginTop = '0.5rem'
      notes.style.color = 'var(--text-secondary)'
      notes.textContent = d.notes
      item.appendChild(notes)
    }

    // View Documents button (calls access-docs edge function)
    if (d.id) {
      const btnContainer = document.createElement('div')
      btnContainer.style.marginTop = '0.75rem'
      btnContainer.style.display = 'flex'
      btnContainer.style.gap = '0.5rem'
      
      const viewDocBtn = document.createElement('button')
      viewDocBtn.className = 'btn'
      viewDocBtn.style.padding = '0.5rem 1rem'
      viewDocBtn.style.fontSize = '0.85rem'
      viewDocBtn.textContent = '📄 View Documents'
      viewDocBtn.addEventListener('click', async () => {
        await openDocumentsModal(d.id, d.title)
      })
      btnContainer.appendChild(viewDocBtn)
      item.appendChild(btnContainer)
    }

    // Documents (from d.documents if available from initial load)
    if (d.documents && d.documents.length > 0) {
      const filesHeader = document.createElement('div')
      filesHeader.style.marginTop = '0.5rem'
      filesHeader.style.fontSize = '0.9rem'
      filesHeader.style.color = 'var(--text-tertiary)'
      filesHeader.innerHTML = '<strong>Attachments:</strong>'
      item.appendChild(filesHeader)

      d.documents.forEach(doc => {
        const row = document.createElement('div')
        row.style.marginTop = '0.25rem'
        const link = document.createElement('a')
        link.href = doc.file_url || '#'
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.textContent = doc.file_name || 'Document'
        row.appendChild(link)
        if (doc.extracted_text) {
          const excerpt = document.createElement('p')
          excerpt.style.marginTop = '0.25rem'
          excerpt.style.color = 'var(--text-secondary)'
          excerpt.style.fontSize = '0.9rem'
          excerpt.textContent = doc.extracted_text.slice(0, 300) + (doc.extracted_text.length > 300 ? '...' : '')
          row.appendChild(excerpt)
        }
        item.appendChild(row)
      })
    }

    item.appendChild(title)
    item.appendChild(date)
    item.appendChild(meta)
    container.appendChild(item)
  })
}

function renderRecentDecisions() {
  const container = document.getElementById('recentDecisionsList')
  if (!container) return
  
  const decisions = (window.decisions || [])
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 6) // Show only the 6 most recent
  
  if (decisions.length === 0) {
    container.innerHTML = '<div class="recent-decisions-empty">No recent decisions. <a href="#" data-view="add-decision" style="color: var(--primary); text-decoration: none;">Add your first decision</a></div>'
    // Make the link work
    const link = container.querySelector('a')
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        switchView('add-decision')
      })
    }
    return
  }
  
  container.innerHTML = ''
  decisions.forEach(d => {
    const card = document.createElement('div')
    card.className = 'recent-decision-card'
    card.addEventListener('click', () => {
      switchView('memory-archive')
    })
    
    const title = document.createElement('div')
    title.className = 'recent-decision-title'
    title.textContent = d.title || 'Untitled Decision'
    
    const meta = document.createElement('div')
    meta.className = 'recent-decision-meta'
    
    if (d.category) {
      const category = document.createElement('span')
      category.className = 'recent-decision-category'
      category.textContent = d.category
      meta.appendChild(category)
    }
    
    if (d.date) {
      const date = document.createElement('span')
      date.className = 'recent-decision-date'
      date.textContent = new Date(d.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
      meta.appendChild(date)
    }
    
    card.appendChild(title)
    if (d.notes && d.notes.length > 0) {
      const notes = document.createElement('p')
      notes.style.marginTop = '0.5rem'
      notes.style.color = 'var(--text-secondary)'
      notes.style.fontSize = '0.875rem'
      notes.style.display = '-webkit-box'
      notes.style.webkitLineClamp = '2'
      notes.style.webkitBoxOrient = 'vertical'
      notes.style.overflow = 'hidden'
      notes.textContent = d.notes
      card.appendChild(notes)
    }
    card.appendChild(meta)
    container.appendChild(card)
  })
}

// ====== CHAT HANDLERS ======
// Build decision context from past decisions for AI to reference
function buildDecisionContext(decisions) {
  if (!decisions || decisions.length === 0) {
    return 'No previous decisions recorded yet.'
  }

  return decisions
    .slice(0, 10) // Last 10 decisions for context
    .map((d, i) => {
      const docsSummary = (d.documents && d.documents.length)
        ? '\nDocuments:\n' + d.documents.map(doc => `- ${doc.file_name}${doc.extracted_text ? ' (parsed)' : ''}${doc.file_url ? `: ${doc.file_url}` : ''}${doc.extracted_text ? '\n  Extracted: ' + (doc.extracted_text.slice(0, 200).replace(/\n/g, ' ')) + (doc.extracted_text.length > 200 ? '...' : '') : ''}`)
            .join('\n')
        : ''

      return `Decision ${i + 1}: "${d.title}"
Category: ${d.category || 'N/A'}
Date: ${d.date || 'N/A'}
Intent/Goal: ${d.intent || 'N/A'}
Constraints: ${d.constraints || 'N/A'}
Final Choice: ${d.final_choice || 'N/A'}
Reasoning: ${d.final_reasoning || d.notes || 'No notes recorded'}${docsSummary}
---`
    })
    .join('\n')
}

// Build system prompt that enforces advisory role and context-awareness per user requirements
// Build system prompt that enforces advisory role and context-awareness per user requirements
function buildSystemPrompt(decisionContext, userQuery) {
  const safeHistory = decisionContext || "No relevant historical data available for this context.";
  
  return `
### SYSTEM ROLE
You are the **Decision Intelligence Architect**. Your purpose is to augment the user's decision-making capability by synthesizing their historical data into actionable insights.

### INPUT CONTEXT
Current User Query: "${userQuery}"
Decision History: "${safeHistory}"

### OPERATIONAL GUIDELINES
 1. **NO META-TALK:** Do NOT start with phrases like "It sounds like...", "You are asking...", or "Based on the provided context...". Start immediately with the answer or insight.
2. **Advisory Only:** Never tell the user what to do. Use phrases like "Based on your history, you might consider..." or "A consistent theme in your logs is..."
3. **No Robot-Speak:** Do NOT use labels like "Step 1", "Step 2", or "The Mirror". Write in natural, professional paragraphs.

### CRITICAL RULES
1. **ONE MATCH ONLY:** Do not summarize the entire history. Scan the data and select ONLY the one specific past decision that is most similar to the Current Question. Ignore all other unrelated decisions.
2. **NO TRANSITIONS:** Do not say "Additionally..." or "Similarly..." to bridge unrelated topics. Stick to the one relevant topic.
3. **PLAIN TEXT:** Use paragraph breaks for structure. Do not use asterisks (**), hashtags (#), or bullet points.
4. **DIRECT APPLICATION:**
   - State the relevant past decision name and date.
   - Explain the specific logic you used back then.
   - Apply that exact logic to the current question.
   - End with a question that helps them clarify their next step.

### GOAL
If the user asks about "Education", look ONLY for "Education" decisions. Do not talk about "Micro-Communities" or "Ads" unless they are explicitly about Education. If no direct match exists, use the most logically similar constraint (e.g., budget vs. time).

###FORMATTING: Do NOT use markdown bolding (**), italics, or headers. Output plain text only."

**Tone:** Professional, insightful, and conversational.
`;
}

function appendChatMessage(text, who = 'user') {
  if (!chatMessages) return
  const msg = document.createElement('div')
  msg.className = `chat-message ${who}`
  msg.textContent = text
  chatMessages.appendChild(msg)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function showWelcomeMessage() {
  if (!chatMessages) return
  const welcomeMsg = document.createElement('div')
  welcomeMsg.className = 'chat-message welcome'
  welcomeMsg.textContent = '👋 Welcome! I\'m your AI decision assistant. I can help you analyze past decisions, provide insights, and guide you through complex choices. What would you like to explore today?'
  chatMessages.appendChild(welcomeMsg)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function clearChatUI() {
  // Clear chat UI (but keep database)
  if (chatMessages) {
    chatMessages.innerHTML = ''
  }
}

async function handleSendMessage() {
  const q = chatInput ? chatInput.value.trim() : ''
  if (!q) return

  // append user's message to UI immediately
  appendChatMessage(q, 'user')
  if (chatInput) chatInput.value = ''

  // Persist user message to Supabase if available
  let userId = null
  if (supabaseClient) {
    const { data: userData } = await supabaseClient.auth.getUser()
    userId = userData?.user?.id
    try {
      await supabaseClient.from('chat_messages').insert([{ user_id: userId, role: 'user', content: q }])
    } catch (err) {
      console.warn('Failed to persist user chat message', err)
    }
  } else {
    window.chatHistory.push({ role: 'user', text: q, created_at: new Date().toISOString() })
  }

  // Build decision context from stored decisions
  const decisionContext = buildDecisionContext(window.decisions || [])

  // Build system prompt enforcing advisory role and context-awareness
  const systemPrompt = buildSystemPrompt(decisionContext, q)

  // Call Gemini API directly (client-side)
  // Note: For production, use the Supabase Edge Function instead to keep the API key secret
  try {
    const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY // Loaded from config.js
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      appendChatMessage('Error: Gemini API key not configured. Please update config.js with your API key.', 'assistant')
      return
    }
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 5000,
            temperature: 0.7,
          },
        }),
      }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMsg = errorData?.error?.message || `Error ${res.status}`
      console.error('Gemini API error', res.status, errorMsg)
      appendChatMessage('AI reply failed: ' + errorMsg, 'assistant')
      return
    }

    const payload = await res.json()
    const reply = payload?.candidates?.[0]?.content?.parts?.[0]?.text || 'No reply'
    appendChatMessage(reply, 'assistant')

    // Persist assistant reply
    if (supabaseClient && userId) {
      try {
        await supabaseClient.from('chat_messages').insert([{ user_id: userId, role: 'assistant', content: reply }])
      } catch (err) {
        console.warn('Failed to persist assistant message', err)
      }
    } else {
      window.chatHistory.push({ role: 'assistant', text: reply, created_at: new Date().toISOString() })
    }
  } catch (err) {
    console.error('AI request failed', err)
    appendChatMessage('AI request failed: ' + err.message, 'assistant')
  }
}

// Decision Help — analyze pros & cons and return a leaning (advisory)
// ====== TEAM WORKSPACE HANDLERS ======
function renderTeamMembers() {
  const membersList = document.getElementById('teamMembersList')
  if (!membersList) return
  membersList.innerHTML = ''
  const members = window.teamMembers || []
  if (!Array.isArray(members)) return
  
  members.forEach((m) => {
    if (!m) return
    const row = document.createElement('div')
    row.style.display = 'flex'
    row.style.justifyContent = 'space-between'
    row.style.alignItems = 'center'
    row.style.padding = '0.5rem'
    row.style.border = '1px solid rgba(71,85,105,0.15)'
    row.style.borderRadius = '6px'
    const left = document.createElement('div')
    left.textContent = m
    const btn = document.createElement('button')
    btn.className = 'btn'
    btn.textContent = 'Remove'
    btn.addEventListener('click', () => {
      if (typeof removeTeamMemberByEmail === 'function') {
        removeTeamMemberByEmail(m)
      }
    })
    row.appendChild(left)
    row.appendChild(btn)
    membersList.appendChild(row)
  })
}

async function handleAddTeamMember() {
  const email = teamMemberEmail ? teamMemberEmail.value.trim() : ''
  if (!email) return

  if (!supabaseClient) {
    window.teamMembers.push(email)
    if (teamMemberEmail) teamMemberEmail.value = ''
    renderTeamMembers()
    renderDashboardStats()
    return
  }

  const { data: userData, error: userError } = await supabaseClient.auth.getUser()
  if (userError || !userData?.user) {
    alert('You must be signed in to add team members')
    return
  }
  const ownerId = userData.user.id

  const { error } = await supabaseClient
    .from('team_members')
    .insert([{ team_owner: ownerId, member_email: email }])

  if (error) {
    console.error('Failed to add team member', error)
    alert(error.message || 'Failed to add member')
    return
  }

  if (teamMemberEmail) teamMemberEmail.value = ''
  await loadTeamMembers()
  renderDashboardStats()
}

async function removeTeamMemberByEmail(email) {
  if (!supabaseClient) {
    const idx = window.teamMembers.indexOf(email)
    if (idx !== -1) window.teamMembers.splice(idx, 1)
    renderTeamMembers()
    renderDashboardStats()
    return
  }

  const { data: userData } = await supabaseClient.auth.getUser()
  const ownerId = userData?.user?.id
  if (!ownerId) return

  const { error } = await supabaseClient
    .from('team_members')
    .delete()
    .match({ team_owner: ownerId, member_email: email })

  if (error) return console.error('Failed to remove member', error)
  await loadTeamMembers()
  renderDashboardStats()
}

// Load team members from Supabase for the current user
async function loadTeamMembers() {
  if (!supabaseClient) {
    renderTeamMembers()
    return
  }

  try {
    const { data: userData } = await supabaseClient.auth.getUser()
    const ownerId = userData?.user?.id
    if (!ownerId) return

    const { data, error } = await supabaseClient
      .from('team_members')
      .select('member_email')
      .eq('team_owner', ownerId)
      .order('invited_at', { ascending: false })

    if (error) return console.error('Failed to load team members', error)

    window.teamMembers = (data || []).map(r => r.member_email)
    renderTeamMembers()
  } catch (err) {
    console.error('loadTeamMembers error', err)
  }
}


// ====== ADD DECISION LOGIC ======
async function handleAddDecision(e) {
  e.preventDefault()

  const title = decisionTitle ? decisionTitle.value.trim() : ''
  const description = decisionDescription ? decisionDescription.value.trim() : ''
  const category = decisionCategory ? decisionCategory.value : ''
  const date = decisionDate ? decisionDate.value : ''
  const notes = decisionNotes ? decisionNotes.value.trim() : ''
  const files = decisionFiles ? Array.from(decisionFiles.files || []) : []

  if (!title || !description || !category || !date) {
    showMessage('Please fill in all required fields (title, description, category, date)', 'error')
    return
  }

  if (!supabaseClient) {
    showMessage('Supabase is not configured. Decision not saved.', 'error')
    return
  }

  // Get current user
  const { data: userData, error: userError } = await supabaseClient.auth.getUser()
  if (userError || !userData?.user) {
    showMessage('You must be signed in to add a decision', 'error')
    return
  }

  const userId = userData.user.id

  // Insert decision into Supabase (minimal required fields) and return the inserted row
  const { data, error } = await supabaseClient
    .from('decisions')
    .insert([
      {
        title,
        description: description || null,
        category,
        date,
        user_id: userId,
        notes: notes || null,
      },
    ])
    .select()

  if (error) {
    console.error('Failed to add decision', error)
    showMessage('Failed to save decision: ' + error.message, 'error')
    return
  }

  // The inserted decision (returning)
  const insertedDecision = Array.isArray(data) && data.length ? data[0] : data
  const decisionId = insertedDecision?.id || null

  // If the user attached files, upload them to Supabase Storage and record metadata
  if (files.length > 0 && decisionId) {
    try {
      for (const file of files) {
        // Try to extract text in-browser for plain text files
        let extracted_text = null
        if (file.type && file.type.startsWith('text/')) {
          extracted_text = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (ev) => resolve(String(ev.target.result))
            reader.onerror = () => resolve(null)
            reader.readAsText(file)
          })
        }

        // Upload to storage (bucket: 'decision_files', path: userId/decisionId/timestamp_filename)
        const filePath = `${userId}/${decisionId}/${Date.now()}_${file.name}`
        try {
          const { error: uploadError } = await supabaseClient.storage.from('decision_files').upload(filePath, file)
          if (uploadError) {
            console.warn('File upload failed for', file.name, uploadError)
            // continue to next file rather than throwing
            continue
          }

          // Try to get a public URL first
          let publicUrl = null
          try {
            const { data: publicUrlData } = supabaseClient.storage.from('decision_files').getPublicUrl(filePath)
            publicUrl = publicUrlData?.publicUrl || null
          } catch (e) {
            console.warn('Failed to get public URL for', filePath, e)
          }

          // If public URL is not available (private bucket), try creating a signed URL (1 hour)
          if (!publicUrl) {
            try {
              const { data: signedData, error: signedErr } = await supabaseClient.storage.from('decision_files').createSignedUrl(filePath, 60 * 60)
              if (signedErr) {
                console.warn('Signed URL creation failed', signedErr)
              } else {
                publicUrl = signedData?.signedURL || null
              }
            } catch (e) {
              console.warn('Signed URL creation threw', e)
            }
          }

          // Get the absolute current user from session (not cached)
          const { data: sessionData } = await supabaseClient.auth.getSession()
          const sessionUserId = sessionData?.session?.user?.id

          if (!sessionUserId) {
            console.error('No active session found for document insert')
            showMessage('Decision saved but attachments could not be recorded: no active session. Please sign in again.', 'error')
            continue
          }

          // Insert document metadata using the current session's user_id
          const { data: docData, error: docError } = await supabaseClient.from('decision_documents').insert([
            {
              decision_id: decisionId,
              user_id: sessionUserId,
              file_name: file.name,
              file_url: publicUrl,
              extracted_text: extracted_text || null,
            },
          ]).select()

          if (docError) {
            console.warn('Failed to record document metadata', docError)
            const msg = String(docError?.message || docError).toLowerCase()
            if (msg.includes('row-level') || msg.includes('row level')) {
              console.error('RLS blocked insert: ensure the user session is active and `user_id` equals auth.uid().')
              showMessage('Decision saved but attachments could not be recorded due to DB row-level security. Please sign in again and try.', 'error')
            } else {
              // surface a user-visible message but do not block saving the decision
              showMessage('Decision saved but failed to record one or more attachments (see console).', 'error')
            }
          }
        } catch (err) {
          console.warn('Error uploading file', err)
          showMessage('Decision saved but file upload failed for ' + file.name + '. See console for details.', 'error')
        }
      }
    } catch (err) {
      console.warn('File processing error', err)
      showMessage('Decision saved but there was an error processing attachments.', 'error')
    }
  } else if (files.length > 0 && !decisionId) {
    // This is an important failure mode — ensure we surface it
    console.error('Decision saved but no decision ID returned; attachments were not uploaded.')
    showMessage('Decision saved, but attachments could not be uploaded (missing decision id).', 'error')
  }

  showMessage('Decision saved successfully!', 'success')
  addDecisionForm.reset()

  // Reload decisions to show new one and attached documents
  await loadDecisions()
  renderDashboardStats()
  renderMemoryArchive()
  renderRecentDecisions()
}

// Open documents modal via access-docs edge function
async function openDocumentsModal(decisionId, decisionTitle) {
  if (!supabaseClient) {
    alert('Supabase not configured. Cannot load documents.')
    return
  }

  // Get the edge function URL from your Supabase project
  // Format: https://<project-ref>.supabase.co/functions/v1/access-docs
  const SUPABASE_URL = 'https://ckeubdntzjjjzzmmaqpk.supabase.co'
  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/access-docs?decisionId=${decisionId}`

  try {
    // Get auth session to pass Authorization header
    const { data: userData } = await supabaseClient.auth.getUser()
    const authToken = userData?.user?.id ? (await supabaseClient.auth.getSession()).data?.session?.access_token : null

    // Call the edge function
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      }
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      console.error('Failed to fetch documents from edge function', errData)
      alert('Failed to load documents: ' + (errData?.error || response.status))
      return
    }

    const { documents } = await response.json()

    // Display documents in a simple modal/overlay
    showDocumentsOverlay(documents, decisionTitle)
  } catch (err) {
    console.error('Error calling access-docs function', err)
    alert('Error loading documents: ' + err.message)
  }
}

function showDocumentsOverlay(documents, decisionTitle) {
  // Create modal overlay
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.top = '0'
  overlay.style.left = '0'
  overlay.style.width = '100%'
  overlay.style.height = '100%'
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  overlay.style.display = 'flex'
  overlay.style.alignItems = 'center'
  overlay.style.justifyContent = 'center'
  overlay.style.zIndex = '9999'

  const modal = document.createElement('div')
  modal.style.backgroundColor = 'var(--surface)'
  modal.style.color = 'var(--text-primary)'
  modal.style.borderRadius = '12px'
  modal.style.padding = '2rem'
  modal.style.maxWidth = '600px'
  modal.style.maxHeight = '80vh'
  modal.style.overflowY = 'auto'
  modal.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
  modal.style.border = '1px solid var(--border)'

  const title = document.createElement('h3')
  title.textContent = `Documents for: ${decisionTitle}`
  title.style.marginBottom = '1rem'
  modal.appendChild(title)

  if (!documents || documents.length === 0) {
    const noDocsMsg = document.createElement('p')
    noDocsMsg.textContent = 'No documents found for this decision.'
    noDocsMsg.style.color = 'var(--text-secondary)'
    modal.appendChild(noDocsMsg)
  } else {
    const docList = document.createElement('div')
    docList.style.display = 'flex'
    docList.style.flexDirection = 'column'
    docList.style.gap = '1rem'

    documents.forEach((doc) => {
      const docItem = document.createElement('div')
      docItem.style.padding = '1rem'
      docItem.style.backgroundColor = 'var(--background)'
      docItem.style.borderRadius = '8px'
      docItem.style.border = '1px solid var(--border)'

      const fileName = document.createElement('div')
      fileName.style.fontWeight = '600'
      fileName.style.marginBottom = '0.5rem'
      fileName.textContent = doc.file_name || 'Unnamed Document'

      const fileLink = document.createElement('a')
      fileLink.href = doc.file_url || '#'
      fileLink.target = '_blank'
      fileLink.rel = 'noopener noreferrer'
      fileLink.style.color = 'var(--primary)'
      fileLink.style.textDecoration = 'none'
      fileLink.textContent = '🔗 Open File'

      const linkContainer = document.createElement('div')
      linkContainer.style.marginBottom = '0.5rem'
      linkContainer.appendChild(fileLink)

      docItem.appendChild(fileName)
      docItem.appendChild(linkContainer)

      if (doc.extracted_text) {
        const extractedLabel = document.createElement('div')
        extractedLabel.style.fontSize = '0.85rem'
        extractedLabel.style.color = 'var(--text-tertiary)'
        extractedLabel.style.marginBottom = '0.25rem'
        extractedLabel.textContent = 'Extracted Text:'
        
        const extractedText = document.createElement('p')
        extractedText.style.fontSize = '0.875rem'
        extractedText.style.color = 'var(--text-secondary)'
        extractedText.style.margin = '0'
        extractedText.style.padding = '0.5rem'
        extractedText.style.backgroundColor = 'var(--surface)'
        extractedText.style.borderRadius = '4px'
        extractedText.style.maxHeight = '200px'
        extractedText.style.overflowY = 'auto'
        extractedText.textContent = doc.extracted_text
        
        docItem.appendChild(extractedLabel)
        docItem.appendChild(extractedText)
      }

      docList.appendChild(docItem)
    })

    modal.appendChild(docList)
  }

  // Close button
  const closeBtn = document.createElement('button')
  closeBtn.className = 'btn'
  closeBtn.style.marginTop = '1.5rem'
  closeBtn.style.width = '100%'
  closeBtn.textContent = 'Close'
  closeBtn.addEventListener('click', () => {
    overlay.remove()
  })
  modal.appendChild(closeBtn)

  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove()
    }
  })
}

function showMessage(msg, type) {
  if (!addDecisionMessage) return
  addDecisionMessage.textContent = msg
  addDecisionMessage.className = 'form-message'
  addDecisionMessage.classList.add(type === 'error' ? 'error-message' : 'success-message')
  addDecisionMessage.style.display = ''

  // Auto-hide after 5 seconds
  setTimeout(() => {
    addDecisionMessage.style.display = 'none'
  }, 5000)
}

function closeSearch() {
  searchResults.classList.add("hidden")
  searchBackdrop.classList.add("hidden")
}
