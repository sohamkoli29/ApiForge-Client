import React, { useState, useEffect } from 'react'
import { useAuth } from "./components/AuthProvider"
import Sidebar from './components/Sidebar'
import RequestForm from './components/RequestForm'
import ResponseViewer from './components/ResponseViewer'
import UserProfile from './components/UserProfile'
import Footer from './components/Footer'
import { Toaster } from 'react-hot-toast'
import { supabase } from './supabase'
import { Menu, X, Zap, LayoutDashboard } from 'lucide-react'
import TaskLogin from './components/task/TaskLogin'
import TaskDashboard from './components/task/TaskDashboard'

function App() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('history')
  const [response, setResponse] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentRequest, setCurrentRequest] = useState({
    url: '',
    method: 'GET',
    headers: [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [{ id: 1, key: '', value: '', enabled: true }],
    body: '{\n  \n}'
  })
  const [collections, setCollections] = useState([])

  // Task Manager state
  const [view, setView] = useState('forge') // 'forge' | 'tasks'
  const [taskUser, setTaskUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jwt_user') || 'null') } catch { return null }
  })

  const getUserId = () => user?.id || 'anonymous'

  useEffect(() => { loadCollectionsFromDatabase() }, [user])

  const loadCollectionsFromDatabase = async () => {
    const userId = getUserId()
    if (userId === 'anonymous') { setCollections(getCollectionsFromStorage()); return }
    try {
      const { data, error } = await supabase.from('collections').select(`*, collection_items(*)`).eq('user_id', userId).order('updated_at', { ascending: false })
      if (error) throw error
      if (data && data.length > 0) {
        setCollections(data.map(c => ({
          id: c.id, userId: c.user_id, name: c.name, description: c.description, color: c.color,
          itemCount: c.collection_items?.length || 0,
          items: c.collection_items?.map(item => ({ id: item.id, collectionId: item.collection_id, userId: item.user_id, name: item.name, url: item.url, method: item.method, headers: item.headers, params: item.params, body: item.body, description: item.description, createdAt: new Date(item.created_at).getTime(), updatedAt: new Date(item.updated_at).getTime() })) || [],
          createdAt: new Date(c.created_at).getTime(), updatedAt: new Date(c.updated_at).getTime()
        })))
      } else { setCollections(getCollectionsFromStorage()) }
    } catch { setCollections(getCollectionsFromStorage()) }
  }

  const handleSaveRequest = async (requestData) => {
    try {
      const userId = getUserId()
      if (supabase && userId !== 'anonymous') {
        try {
          const { error } = await supabase.from('history').insert({ user_id: userId, url: requestData.url, method: requestData.method, headers: requestData.headers ? JSON.stringify(requestData.headers) : null, params: requestData.params ? JSON.stringify(requestData.params) : null, body: requestData.body || null, response_status: requestData.responseStatus || null, duration: requestData.duration || null }).select()
          if (!error) return
        } catch {}
      }
      const historyItem = { id: Date.now().toString(), userId: getUserId(), ...requestData, createdAt: Date.now() }
      const existingHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
      localStorage.setItem('apiTesterHistory', JSON.stringify([historyItem, ...existingHistory.slice(0, 49)]))
    } catch {}
  }

  const createCollection = async (collectionData) => {
    const userId = getUserId()
    if (userId === 'anonymous') { const nc = { id: 'collection_' + Date.now(), userId, ...collectionData, itemCount: 0, createdAt: Date.now(), updatedAt: Date.now(), items: [] }; const uc = [nc, ...collections]; saveCollectionsToStorage(uc); setCollections(uc); return nc.id }
    try { const { data, error } = await supabase.from('collections').insert({ user_id: userId, name: collectionData.name, description: collectionData.description, color: collectionData.color }).select().single(); if (error) throw error; const nc = { id: data.id, userId: data.user_id, name: data.name, description: data.description, color: data.color, itemCount: 0, items: [], createdAt: new Date(data.created_at).getTime(), updatedAt: new Date(data.updated_at).getTime() }; setCollections([nc, ...collections]); return data.id }
    catch { const nc = { id: 'collection_' + Date.now(), userId, ...collectionData, itemCount: 0, createdAt: Date.now(), updatedAt: Date.now(), items: [] }; const uc = [nc, ...collections]; saveCollectionsToStorage(uc); setCollections(uc); return nc.id }
  }

  const updateCollection = async (collectionId, updates) => {
    const userId = getUserId()
    if (userId === 'anonymous') { const uc = collections.map(c => c.id === collectionId ? { ...c, ...updates, updatedAt: Date.now() } : c); saveCollectionsToStorage(uc); setCollections(uc); return }
    try { const { error } = await supabase.from('collections').update({ name: updates.name, description: updates.description, color: updates.color, updated_at: new Date().toISOString() }).eq('id', collectionId).eq('user_id', userId); if (error) throw error; setCollections(collections.map(c => c.id === collectionId ? { ...c, ...updates, updatedAt: Date.now() } : c)) }
    catch { const uc = collections.map(c => c.id === collectionId ? { ...c, ...updates, updatedAt: Date.now() } : c); saveCollectionsToStorage(uc); setCollections(uc) }
  }

  const deleteCollection = async (collectionId) => {
    const userId = getUserId()
    if (userId === 'anonymous') { const uc = collections.filter(c => c.id !== collectionId); saveCollectionsToStorage(uc); setCollections(uc); return }
    try { const { error } = await supabase.from('collections').delete().eq('id', collectionId).eq('user_id', userId); if (error) throw error; setCollections(collections.filter(c => c.id !== collectionId)) }
    catch { const uc = collections.filter(c => c.id !== collectionId); saveCollectionsToStorage(uc); setCollections(uc) }
  }

  const addToCollection = async (collectionId, requestData) => {
    const userId = getUserId()
    if (userId === 'anonymous') { const ni = { id: 'item_' + Date.now(), collectionId, userId, ...requestData, createdAt: Date.now(), updatedAt: Date.now() }; const uc = collections.map(c => c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1, updatedAt: Date.now(), items: [...(c.items || []), ni] } : c); saveCollectionsToStorage(uc); setCollections(uc); return ni.id }
    try { const { data, error } = await supabase.from('collection_items').insert({ collection_id: collectionId, user_id: userId, name: requestData.name, url: requestData.url, method: requestData.method, headers: requestData.headers ? JSON.stringify(requestData.headers) : null, params: requestData.params ? JSON.stringify(requestData.params) : null, body: requestData.body || null, description: requestData.description || null }).select().single(); if (error) throw error; await supabase.from('collections').update({ updated_at: new Date().toISOString() }).eq('id', collectionId); const ni = { id: data.id, collectionId: data.collection_id, userId: data.user_id, name: data.name, url: data.url, method: data.method, headers: data.headers, params: data.params, body: data.body, description: data.description, createdAt: new Date(data.created_at).getTime(), updatedAt: new Date(data.updated_at).getTime() }; setCollections(collections.map(c => c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1, updatedAt: Date.now(), items: [...(c.items || []), ni] } : c)); return data.id }
    catch { const ni = { id: 'item_' + Date.now(), collectionId, userId, ...requestData, createdAt: Date.now(), updatedAt: Date.now() }; const uc = collections.map(c => c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1, updatedAt: Date.now(), items: [...(c.items || []), ni] } : c); saveCollectionsToStorage(uc); setCollections(uc); return ni.id }
  }

  const handleLoadRequest = (request) => {
    setCurrentRequest({ url: request.url, method: request.method, headers: request.headers ? (Array.isArray(request.headers) ? request.headers : JSON.parse(request.headers)) : [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }], params: request.params ? (Array.isArray(request.params) ? request.params : JSON.parse(request.params)) : [{ id: 1, key: '', value: '', enabled: true }], body: request.body || '{\n  \n}' })
    setSidebarOpen(false)
  }

  const getHistoryFromStorage = () => { try { return JSON.parse(localStorage.getItem('apiTesterHistory') || '[]').filter(i => i.userId === getUserId()) } catch { return [] } }
  const getCollectionsFromStorage = () => { try { return JSON.parse(localStorage.getItem('apiTesterCollections') || '[]').filter(c => c.userId === getUserId()) } catch { return [] } }
  const saveCollectionsToStorage = (cols) => { try { const all = JSON.parse(localStorage.getItem('apiTesterCollections') || '[]'); localStorage.setItem('apiTesterCollections', JSON.stringify([...all.filter(c => c.userId !== getUserId()), ...cols])) } catch (e) { throw e } }

  const handleTaskLogout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_user')
    setTaskUser(null)
  }

  // View switcher tab
  const ViewSwitcher = () => (
    <div style={{ display: 'flex', gap: 0, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
      {[{ id: 'forge', icon: <Zap size={13} />, label: 'ApiForge' }, { id: 'tasks', icon: <LayoutDashboard size={13} />, label: 'Tasks' }].map(v => (
        <button key={v.id} onClick={() => setView(v.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Syne', sans-serif", background: view === v.id ? 'var(--accent)' : 'transparent', color: view === v.id ? 'white' : 'var(--text-muted)', transition: 'all 0.15s' }}>
          {v.icon} {v.label}
        </button>
      ))}
    </div>
  )

  // Task Manager view
  if (view === 'tasks') {
    return (
      <div style={{ minHeight: '100vh' }}>
        {/* Small switcher to go back */}
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          <ViewSwitcher />
        </div>
        {taskUser ? <TaskDashboard user={taskUser} onLogout={handleTaskLogout} /> : <TaskLogin onLogin={u => setTaskUser(u)} />}
      </div>
    )
  }

  // ApiForge view (original)
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Syne', sans-serif" }}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#fff', color: '#1c1b1b', border: '1px solid #e5e2e1', borderLeft: '4px solid #C9A96E', borderRadius: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', boxShadow: '0 8px 24px rgba(45,45,45,0.1)' } }} />

      {/* Mobile Header */}
      <div style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>ApiForge</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ViewSwitcher />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 40px)' }}>
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, display: 'none' }} className="sidebar-overlay" />}

        <div className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`} style={{ width: 280, flexShrink: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLoadRequest={handleLoadRequest} getHistory={getHistoryFromStorage} collections={collections} onCreateCollection={createCollection} onUpdateCollection={updateCollection} onDeleteCollection={deleteCollection} onAddToCollection={addToCollection} userId={getUserId()} currentRequest={currentRequest} user={user} />
          <UserProfile />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Top bar with view switcher */}
          <div style={{ padding: '8px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <ViewSwitcher />
          </div>
          <div style={{ flex: '0 0 auto', maxHeight: '55%', overflow: 'auto', borderBottom: '1px solid var(--border)' }}>
            <RequestForm onResponse={setResponse} onSaveRequest={handleSaveRequest} currentRequest={currentRequest} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <ResponseViewer response={response} />
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .sidebar-wrapper { position: fixed !important; top: 0; left: -280px; height: 100vh; z-index: 45; transition: left 0.25s ease; }
          .sidebar-wrapper.sidebar-open { left: 0 !important; }
          .sidebar-overlay { display: block !important; }
        }
        @media (min-width: 769px) { .mobile-header { display: none !important; } }
      `}</style>
    </div>
  )
}

export default App