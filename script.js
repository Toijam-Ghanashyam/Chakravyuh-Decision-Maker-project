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
const decisionCategory = document.getElementById('decisionCategory')
const decisionDate = document.getElementById('decisionDate')
const decisionNotes = document.getElementById('decisionNotes')
const addDecisionMessage = document.getElementById('addDecisionMessage')
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
  if (!supabaseClient) {
    // render from local history
    if (window.chatHistory && chatMessages) {
      chatMessages.innerHTML = ''
      window.chatHistory.forEach(m => appendChatMessage(m.text, m.role === 'user' ? 'user' : 'assistant'))
    }
    return
  }

  try {
    const { data: userData } = await supabaseClient.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return

    const { data, error } = await supabaseClient
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) return console.error('Failed to load chat history', error)

    window.chatHistory = (data || []).map(r => ({ role: r.role, text: r.content, created_at: r.created_at }))
    if (chatMessages) {
      chatMessages.innerHTML = ''
      window.chatHistory.forEach(m => appendChatMessage(m.text, m.role === 'user' ? 'user' : 'assistant'))
    }
  } catch (err) {
    console.error('loadChatHistory error', err)
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
  // Update UI after loading
  try { renderDashboardStats(); renderMemoryArchive(); } catch (e) { /* ignore */ }
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
  const decisions = (window.decisions || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date))
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
    if (d.notes) {
      const notes = document.createElement('p')
      notes.style.marginTop = '0.5rem'
      notes.style.color = 'var(--text-secondary)'
      notes.textContent = d.notes
      item.appendChild(title)
      item.appendChild(date)
      item.appendChild(meta)
      item.appendChild(notes)
    } else {
      item.appendChild(title)
      item.appendChild(date)
      item.appendChild(meta)
    }
    container.appendChild(item)
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
      return `Decision ${i + 1}: "${d.title}"
Category: ${d.category || 'N/A'}
Date: ${d.date || 'N/A'}
Notes/Reasoning: ${d.notes || 'No notes recorded'}
---`
    })
    .join('\n')
}

// Build system prompt that enforces advisory role and context-awareness per user requirements
function buildSystemPrompt(decisionContext) {
  return `You are a Decision Intelligence Assistant designed to help users make better decisions by learning from their history. Your role is strictly ADVISORY—you guide, suggest, and explain, but never decide for the user.

CORE PRINCIPLES (STRICTLY ENFORCED):

1. RECALL INTENT, NOT JUST FACTS
- When referencing past decisions, explain the user's intent (what they were trying to achieve), constraints (time, money, risk), and reasoning.
- Example: "Previously, you chose option X because you prioritized speed over cost under time pressure."

2. CONTEXT-AWARE EXPLANATIONS
- Always ground your suggestions in the user's historical patterns.
- Reference past decisions explicitly: "In your decision on [date], you avoided Y due to [constraint]. Here's why that pattern might apply again."
- Do NOT give generic advice; make it specific to this user's history and values.

3. ADVISORY ROLE ONLY (CRITICAL)
- Never tell the user what to do. Use phrases like: "Based on your history, you might consider...", "Here's how this aligns with your past decisions...", "What worked before was..."
- Your job is to provide context and options, not to decide.
- Emphasize the user's autonomy in every response.

4. LEARN AND EVOLVE
- Recognize patterns across the user's decisions over time.
- Identify themes (e.g., "You tend to prioritize X when Y is at stake").
- Use these patterns to provide increasingly personalized guidance.

5. PRIVACY & ETHICS
- Only reference data the user has explicitly told you (notes, titles, categories).
- Do NOT infer sensitive information or profile the user beyond what they share.
- Do NOT make passive assumptions about their values, constraints, or preferences.
- Respect autonomy and transparency.

---

USER'S RECENT DECISION HISTORY:
${decisionContext}

---

Now, respond to the user's question by:
1. Acknowledging their question
2. Referencing relevant past decisions with context
3. Providing context-aware suggestions (not directives)
4. Emphasizing that the final decision is theirs

Remember: You are an advisor, not a decision-maker. Guide with intelligence, not authority.`
}

function appendChatMessage(text, who = 'user') {
  if (!chatMessages) return
  const msg = document.createElement('div')
  msg.style.marginBottom = '0.5rem'
  msg.style.padding = '0.5rem 0.75rem'
  msg.style.borderRadius = '8px'
  msg.style.maxWidth = '80%'
  if (who === 'user') {
    msg.style.background = 'rgba(255,255,255,0.04)'
    msg.style.color = 'var(--text-primary)'
    msg.style.alignSelf = 'flex-end'
  } else {
    msg.style.background = 'rgba(59,130,246,0.08)'
    msg.style.color = 'var(--text-primary)'
    msg.style.alignSelf = 'flex-start'
  }
  msg.textContent = text
  chatMessages.appendChild(msg)
  chatMessages.scrollTop = chatMessages.scrollHeight
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
  const systemPrompt = buildSystemPrompt(decisionContext)

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
              parts: [{ text: systemPrompt + "\n\n---\n\nUser question: " + q }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 800,
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
  const category = decisionCategory ? decisionCategory.value : ''
  const date = decisionDate ? decisionDate.value : ''
  const notes = decisionNotes ? decisionNotes.value.trim() : ''

  if (!title || !category || !date) {
    showMessage('Please fill in all required fields', 'error')
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

  // Insert decision into Supabase
  const { data, error } = await supabaseClient
    .from('decisions')
    .insert([
      {
        title,
        category,
        date,
        user_id: userId,
        notes: notes || null,
      },
    ])

  if (error) {
    console.error('Failed to add decision', error)
    showMessage('Failed to save decision: ' + error.message, 'error')
    return
  }

  showMessage('Decision saved successfully!', 'success')
  addDecisionForm.reset()

  // Reload decisions to show new one
  await loadDecisions()
  renderDashboardStats()
  renderMemoryArchive()
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
