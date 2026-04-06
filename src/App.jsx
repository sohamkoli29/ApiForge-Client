import React, { useState, useEffect } from 'react'
import { useAuth } from "./components/AuthProvider"
import Sidebar from './components/Sidebar'
import RequestForm from './components/RequestForm'
import ResponseViewer from './components/ResponseViewer'
import UserProfile from './components/UserProfile'
import Footer from './components/Footer'
import { Toaster } from 'react-hot-toast'
import { supabase } from './supabase'
import { Menu, X } from 'lucide-react'

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

  const getUserId = () => user?.id || 'anonymous'

  useEffect(() => { loadCollectionsFromDatabase() }, [user])

  const loadCollectionsFromDatabase = async () => {
    const userId = getUserId()
    if (userId === 'anonymous') {
      setCollections(getCollectionsFromStorage())
      return
    }
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`*, collection_items(*)`)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (error) throw error
      if (data && data.length > 0) {
        const formattedCollections = data.map(collection => ({
          id: collection.id,
          userId: collection.user_id,
          name: collection.name,
          description: collection.description,
          color: collection.color,
          itemCount: collection.collection_items?.length || 0,
          items: collection.collection_items?.map(item => ({
            id: item.id,
            collectionId: item.collection_id,
            userId: item.user_id,
            name: item.name,
            url: item.url,
            method: item.method,
            headers: item.headers,
            params: item.params,
            body: item.body,
            description: item.description,
            createdAt: new Date(item.created_at).getTime(),
            updatedAt: new Date(item.updated_at).getTime()
          })) || [],
          createdAt: new Date(collection.created_at).getTime(),
          updatedAt: new Date(collection.updated_at).getTime()
        }))
        setCollections(formattedCollections)
      } else {
        setCollections(getCollectionsFromStorage())
      }
    } catch (error) {
      setCollections(getCollectionsFromStorage())
    }
  }

  const handleSaveRequest = async (requestData) => {
    try {
      const userId = getUserId()
      if (supabase && userId !== 'anonymous') {
        try {
          const { data, error } = await supabase.from('history').insert({
            user_id: userId,
            url: requestData.url,
            method: requestData.method,
            headers: requestData.headers ? JSON.stringify(requestData.headers) : null,
            params: requestData.params ? JSON.stringify(requestData.params) : null,
            body: requestData.body || null,
            response_status: requestData.responseStatus || null,
            duration: requestData.duration || null
          }).select()
          if (!error) return
        } catch (dbError) {}
      }
      const historyItem = { id: Date.now().toString(), userId: getUserId(), ...requestData, createdAt: Date.now() }
      const existingHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
      const newHistory = [historyItem, ...existingHistory.slice(0, 49)]
      localStorage.setItem('apiTesterHistory', JSON.stringify(newHistory))
    } catch (error) {}
  }

  const createCollection = async (collectionData) => {
    const userId = getUserId()
    if (userId === 'anonymous') {
      const newCollection = { id: 'collection_' + Date.now(), userId, ...collectionData, itemCount: 0, createdAt: Date.now(), updatedAt: Date.now(), items: [] }
      const updatedCollections = [newCollection, ...collections]
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newCollection.id
    }
    try {
      const { data, error } = await supabase.from('collections').insert({ user_id: userId, name: collectionData.name, description: collectionData.description, color: collectionData.color }).select().single()
      if (error) throw error
      const newCollection = { id: data.id, userId: data.user_id, name: data.name, description: data.description, color: data.color, itemCount: 0, items: [], createdAt: new Date(data.created_at).getTime(), updatedAt: new Date(data.updated_at).getTime() }
      setCollections([newCollection, ...collections])
      return data.id
    } catch (error) {
      const newCollection = { id: 'collection_' + Date.now(), userId, ...collectionData, itemCount: 0, createdAt: Date.now(), updatedAt: Date.now(), items: [] }
      const updatedCollections = [newCollection, ...collections]
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newCollection.id
    }
  }

  const updateCollection = async (collectionId, updates) => {
    const userId = getUserId()
    if (userId === 'anonymous') {
      const updatedCollections = collections.map(c => c.id === collectionId ? { ...c, ...updates, updatedAt: Date.now() } : c)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return
    }
    try {
      const { error } = await supabase.from('collections').update({ name: updates.name, description: updates.description, color: updates.color, updated_at: new Date().toISOString() }).eq('id', collectionId).eq('user_id', userId)
      if (error) throw error
      setCollections(collections.map(c => c.id === collectionId ? { ...c, ...updates, updatedAt: Date.now() } : c))
    } catch (error) {
      const updatedCollections = collections.map(c => c.id === collectionId ? { ...c, ...updates, updatedAt: Date.now() } : c)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
    }
  }

  const deleteCollection = async (collectionId) => {
    const userId = getUserId()
    if (userId === 'anonymous') {
      const updatedCollections = collections.filter(c => c.id !== collectionId)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return
    }
    try {
      const { error } = await supabase.from('collections').delete().eq('id', collectionId).eq('user_id', userId)
      if (error) throw error
      setCollections(collections.filter(c => c.id !== collectionId))
    } catch (error) {
      const updatedCollections = collections.filter(c => c.id !== collectionId)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
    }
  }

  const addToCollection = async (collectionId, requestData) => {
    const userId = getUserId()
    if (userId === 'anonymous') {
      const newItem = { id: 'item_' + Date.now(), collectionId, userId, ...requestData, createdAt: Date.now(), updatedAt: Date.now() }
      const updatedCollections = collections.map(c => c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1, updatedAt: Date.now(), items: [...(c.items || []), newItem] } : c)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newItem.id
    }
    try {
      const { data, error } = await supabase.from('collection_items').insert({ collection_id: collectionId, user_id: userId, name: requestData.name, url: requestData.url, method: requestData.method, headers: requestData.headers ? JSON.stringify(requestData.headers) : null, params: requestData.params ? JSON.stringify(requestData.params) : null, body: requestData.body || null, description: requestData.description || null }).select().single()
      if (error) throw error
      await supabase.from('collections').update({ updated_at: new Date().toISOString() }).eq('id', collectionId)
      const newItem = { id: data.id, collectionId: data.collection_id, userId: data.user_id, name: data.name, url: data.url, method: data.method, headers: data.headers, params: data.params, body: data.body, description: data.description, createdAt: new Date(data.created_at).getTime(), updatedAt: new Date(data.updated_at).getTime() }
      setCollections(collections.map(c => c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1, updatedAt: Date.now(), items: [...(c.items || []), newItem] } : c))
      return data.id
    } catch (error) {
      const newItem = { id: 'item_' + Date.now(), collectionId, userId, ...requestData, createdAt: Date.now(), updatedAt: Date.now() }
      const updatedCollections = collections.map(c => c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1, updatedAt: Date.now(), items: [...(c.items || []), newItem] } : c)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newItem.id
    }
  }

  const handleLoadRequest = (request) => {
    setCurrentRequest({
      url: request.url,
      method: request.method,
      headers: request.headers ? (Array.isArray(request.headers) ? request.headers : JSON.parse(request.headers)) : [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }],
      params: request.params ? (Array.isArray(request.params) ? request.params : JSON.parse(request.params)) : [{ id: 1, key: '', value: '', enabled: true }],
      body: request.body || '{\n  \n}'
    })
    setSidebarOpen(false)
  }

  const getHistoryFromStorage = () => {
    try {
      const allHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
      return allHistory.filter(item => item.userId === getUserId())
    } catch { return [] }
  }

  const getCollectionsFromStorage = () => {
    try {
      const allCollections = JSON.parse(localStorage.getItem('apiTesterCollections') || '[]')
      return allCollections.filter(c => c.userId === getUserId())
    } catch { return [] }
  }

  const saveCollectionsToStorage = (collections) => {
    try {
      const allCollections = JSON.parse(localStorage.getItem('apiTesterCollections') || '[]')
      const otherUsersCollections = allCollections.filter(c => c.userId !== getUserId())
      localStorage.setItem('apiTesterCollections', JSON.stringify([...otherUsersCollections, ...collections]))
    } catch (error) { throw error }
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Syne', sans-serif" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontFamily: "'Syne', sans-serif",
            fontSize: '13px',
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />

      {/* Mobile Header */}
      <div style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>ApiForge</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 40px)' }}>
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, display: 'none' }}
            className="sidebar-overlay"
          />
        )}

        {/* Left Sidebar */}
        <div className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
          width: 280,
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoadRequest={handleLoadRequest}
            getHistory={getHistoryFromStorage}
            collections={collections}
            onCreateCollection={createCollection}
            onUpdateCollection={updateCollection}
            onDeleteCollection={deleteCollection}
            onAddToCollection={addToCollection}
            userId={getUserId()}
            currentRequest={currentRequest}
            user={user}
          />
          <UserProfile />
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Request Form */}
          <div style={{ flex: '0 0 auto', maxHeight: '55%', overflow: 'auto', borderBottom: '1px solid var(--border)' }}>
            <RequestForm
              onResponse={setResponse}
              onSaveRequest={handleSaveRequest}
              currentRequest={currentRequest}
            />
          </div>

          {/* Response Viewer */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <ResponseViewer response={response} />
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .sidebar-wrapper {
            position: fixed !important;
            top: 0;
            left: -280px;
            height: 100vh;
            z-index: 45;
            transition: left 0.25s ease;
          }
          .sidebar-wrapper.sidebar-open { left: 0 !important; }
          .sidebar-overlay { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default App