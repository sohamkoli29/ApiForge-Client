import React, { useState } from 'react'
import { Plus, Folder, Edit3, Trash2, X, Save, FolderPlus, FileText, ChevronDown, ChevronRight, Play, Loader, CheckCircle, XCircle, Link } from 'lucide-react'
import { toast } from 'react-hot-toast'

const methodColors = {
  GET: { color: '#3ecf8e', bg: 'rgba(62,207,142,0.1)' },
  POST: { color: '#6c7fff', bg: 'rgba(108,127,255,0.1)' },
  PUT: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
  DELETE: { color: '#ff5e5e', bg: 'rgba(255,94,94,0.1)' },
  PATCH: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

// Resolve proxy base URL the same way RequestForm does
const getProxyUrl = () => {
  const base = import.meta.env.VITE_API_URL || ''
  const clean = base.replace(/\/$/, '')
  return `${clean}/api/proxy`
}

const CollectionsManager = ({ collections, onCreateCollection, onUpdateCollection, onDeleteCollection, onAddToCollection, currentRequest, onLoadRequest }) => {
  const [isCreating, setIsCreating] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [activeCollection, setActiveCollection] = useState(null)
  const [showAddToCollection, setShowAddToCollection] = useState(false)

  // Manual URL add state
  const [addUrlCollectionId, setAddUrlCollectionId] = useState(null)
  const [newReqName, setNewReqName] = useState('')
  const [newReqUrl, setNewReqUrl] = useState('')
  const [newReqMethod, setNewReqMethod] = useState('GET')

  // Run All state per collection: { [collectionId]: { running, results: [{id, status, httpStatus, duration, error}] } }
  const [runState, setRunState] = useState({})

  const handleCreate = async () => {
    if (!newCollectionName.trim()) { toast.error('Name required'); return }
    try {
      await onCreateCollection({ name: newCollectionName.trim(), description: newCollectionDescription.trim() || undefined })
      setNewCollectionName(''); setNewCollectionDescription(''); setIsCreating(false)
      toast.success('Collection created')
    } catch { toast.error('Failed to create') }
  }

  const handleUpdate = async (collection) => {
    if (!newCollectionName.trim()) { toast.error('Name required'); return }
    try {
      await onUpdateCollection(collection.id, { name: newCollectionName.trim(), description: newCollectionDescription.trim() || undefined })
      setEditingCollection(null); setNewCollectionName(''); setNewCollectionDescription('')
      toast.success('Updated')
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (collection) => {
    if (!window.confirm(`Delete "${collection.name}"?`)) return
    try { await onDeleteCollection(collection.id); toast.success('Deleted') }
    catch { toast.error('Failed to delete') }
  }

  const handleAddToCollection = async (collection) => {
    if (!currentRequest?.url) { toast.error('No active request'); return }
    try {
      await onAddToCollection(collection.id, {
        name: `${currentRequest.method} ${(() => { try { return new URL(currentRequest.url).pathname } catch { return currentRequest.url } })()}`,
        url: currentRequest.url, method: currentRequest.method,
        headers: JSON.stringify(currentRequest.headers), params: JSON.stringify(currentRequest.params), body: currentRequest.body,
      })
      setShowAddToCollection(false); toast.success('Saved to collection')
    } catch { toast.error('Failed to save') }
  }

  const handleAddManualUrl = async (collectionId) => {
    if (!newReqUrl.trim()) { toast.error('URL is required'); return }
    try { new URL(newReqUrl.trim()) } catch { toast.error('Enter a valid URL (include https://)'); return }
    try {
      const name = newReqName.trim() || `${newReqMethod} ${(() => { try { return new URL(newReqUrl.trim()).pathname } catch { return newReqUrl.trim() } })()}`
      await onAddToCollection(collectionId, {
        name,
        url: newReqUrl.trim(),
        method: newReqMethod,
        headers: JSON.stringify([{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }]),
        params: JSON.stringify([]),
        body: '',
      })
      setAddUrlCollectionId(null)
      setNewReqName(''); setNewReqUrl(''); setNewReqMethod('GET')
      toast.success('Request added')
    } catch { toast.error('Failed to add request') }
  }

  // ── Run All: fire requests one by one, update state after each ──────────────
  const handleRunAll = async (collection) => {
    const items = collection.items || []
    if (items.length === 0) { toast.error('No requests in this collection'); return }

    const proxyUrl = getProxyUrl()

    // Initialise all as pending
    const initResults = items.map(item => ({
      id: item.id, status: 'pending', httpStatus: null, duration: null, error: null
    }))

    setRunState(prev => ({ ...prev, [collection.id]: { running: true, results: initResults } }))

    // We maintain a local copy to avoid stale closure issues
    const localResults = [...initResults]

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // Mark this item as running
      localResults[i] = { ...localResults[i], status: 'running' }
      setRunState(prev => ({
        ...prev,
        [collection.id]: { running: true, results: [...localResults] }
      }))

      let result
      try {
        // Parse headers array safely
        // headers can be: null, an array [{key,value,enabled}], a JSON string of that array,
        // or a plain object {key: value} when stored/returned differently by Supabase
        let enabledHeaders = {}
        if (item.headers) {
          let parsed = item.headers
          // If it's a string, try to JSON-parse it first
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed) } catch { parsed = {} }
          }
          if (Array.isArray(parsed)) {
            // Standard [{key, value, enabled}] format
            enabledHeaders = parsed
              .filter(h => h.enabled && h.key?.trim())
              .reduce((acc, h) => { acc[h.key] = h.value; return acc }, {})
          } else if (parsed && typeof parsed === 'object') {
            // Plain {key: value} object — use as-is
            enabledHeaders = parsed
          }
        }

        // Body
        let body = null
        if (item.method !== 'GET' && item.body?.trim()) {
          try { body = JSON.parse(item.body) } catch { body = item.body }
        }

        const startTime = Date.now()
        const res = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.url,
            method: item.method.toUpperCase(),
            headers: enabledHeaders,
            body,
            timeout: 20000,
          }),
        })
        const elapsed = Date.now() - startTime
        const data = await res.json()

        // data.status = the target API's HTTP status code
        const httpStatus = data.status ?? res.status
        const duration = data.duration ?? elapsed
        const isOk = httpStatus >= 200 && httpStatus < 300

        result = { id: item.id, status: isOk ? 'success' : 'error', httpStatus, duration, error: null }
      } catch (err) {
        result = { id: item.id, status: 'error', httpStatus: null, duration: null, error: err.message }
      }

      localResults[i] = result
      setRunState(prev => ({
        ...prev,
        [collection.id]: { running: true, results: [...localResults] }
      }))
    }

    // Mark run complete
    setRunState(prev => ({
      ...prev,
      [collection.id]: { running: false, results: [...localResults] }
    }))

    const passed = localResults.filter(r => r.status === 'success').length
    toast.success(`Run complete · ${passed}/${items.length} passed`)
  }

  const clearRunResults = (collectionId) => {
    setRunState(prev => { const n = { ...prev }; delete n[collectionId]; return n })
  }

  const allCollections = collections.length > 0 ? collections : []

  const s = {
    root: { height: '65vh', display: 'flex', flexDirection: 'column' },
    header: {
      padding: '10px 14px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    },
    title: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' },
    headerBtns: { display: 'flex', gap: 6 },
    smallBtn: (accent) => ({
      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
      borderRadius: 7, border: `1px solid ${accent ? 'rgba(108,127,255,0.3)' : 'var(--border)'}`,
      background: accent ? 'var(--accent-dim)' : 'var(--bg-elevated)',
      color: accent ? 'var(--accent)' : 'var(--text-secondary)',
      cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'Syne', sans-serif",
    }),
    list: { flex: 1, overflowY: 'auto', padding: 10 },
    createForm: {
      padding: 14, borderRadius: 10, border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', marginBottom: 8,
    },
    createTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    input: {
      width: '100%', padding: '8px 10px', borderRadius: 8,
      border: '1px solid var(--border)', background: 'var(--bg-surface)',
      color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", fontSize: 12,
      outline: 'none', marginBottom: 8,
    },
    select: {
      padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
      background: 'var(--bg-surface)', color: 'var(--text-primary)',
      fontFamily: "'DM Mono', monospace", fontSize: 12, outline: 'none', cursor: 'pointer',
    },
    createActions: { display: 'flex', gap: 6, justifyContent: 'flex-end' },
    cancelBtn: {
      padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
      background: 'none', color: 'var(--text-muted)', cursor: 'pointer',
      fontSize: 11, fontWeight: 600, fontFamily: "'Syne', sans-serif",
    },
    saveBtn: {
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
      borderRadius: 7, border: 'none', cursor: 'pointer',
      background: 'var(--accent)', color: 'white',
      fontSize: 11, fontWeight: 700, fontFamily: "'Syne', sans-serif",
    },
    collectionCard: {
      borderRadius: 10, border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', marginBottom: 6, overflow: 'hidden',
    },
    collectionHeader: {
      padding: '10px 12px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
    },
    folderIcon: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--accent-dim)' },
    collectionName: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    collectionMeta: { fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" },
    collectionActions: { display: 'flex', gap: 4, opacity: 0 },
    iconBtn: {
      padding: 5, borderRadius: 6, border: 'none', cursor: 'pointer',
      background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    },
    itemList: { borderTop: '1px solid var(--border)', padding: '6px 8px' },
    requestItem: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
      borderRadius: 7, cursor: 'pointer', marginBottom: 3,
    },
    methodBadge: (method) => ({
      padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800,
      fontFamily: "'DM Mono', monospace", letterSpacing: '0.3px',
      color: (methodColors[method] || {}).color || 'var(--text-muted)',
      background: (methodColors[method] || {}).bg || 'var(--bg-elevated)',
      flexShrink: 0,
    }),
    requestName: { fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
    emptyState: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 20px', gap: 8,
    },
    emptyIcon: { width: 44, height: 44, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
    },
    modalCard: {
      width: '100%', maxWidth: 360, background: 'var(--bg-surface)',
      border: '1px solid var(--border)', borderRadius: 14, padding: 20,
    },
    modalTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    collectionPickBtn: {
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', cursor: 'pointer', marginBottom: 6, textAlign: 'left',
    },
    addUrlForm: {
      margin: '0 8px 6px', padding: 10, borderRadius: 8,
      border: '1px dashed var(--accent-dim)', background: 'rgba(108,127,255,0.04)',
    },
    runResultsBar: {
      padding: '6px 12px', background: 'rgba(0,0,0,0.2)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 10, fontFamily: "'DM Mono', monospace",
    },
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>Collections</span>
        <div style={s.headerBtns}>
          {currentRequest?.url && (
            <button onClick={() => setShowAddToCollection(true)} style={s.smallBtn(false)}>
              <FileText size={11} /> Save
            </button>
          )}
          <button onClick={() => setIsCreating(true)} style={s.smallBtn(true)}>
            <FolderPlus size={11} /> New
          </button>
        </div>
      </div>

      <div style={s.list}>
        {isCreating && (
          <div style={s.createForm}>
            <div style={s.createTitle}>
              New Collection
              <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <input type="text" placeholder="Collection name" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} style={s.input} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <input type="text" placeholder="Description (optional)" value={newCollectionDescription} onChange={e => setNewCollectionDescription(e.target.value)} style={{ ...s.input, marginBottom: 0 }} />
            <div style={{ ...s.createActions, marginTop: 8 }}>
              <button onClick={() => setIsCreating(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} style={s.saveBtn}><Save size={11} /> Create</button>
            </div>
          </div>
        )}

        {allCollections.length === 0 && !isCreating ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}><Folder size={20} color="var(--text-muted)" /></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>No collections</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Create a collection to<br />organize your requests</div>
          </div>
        ) : (
          allCollections.map(collection => {
            const run = runState[collection.id]
            const isRunning = run?.running === true
            const runResults = run?.results || []
            const isExpanded = activeCollection?.id === collection.id

            return (
              <div key={collection.id} style={s.collectionCard} className="collection-card">
                {editingCollection?.id === collection.id ? (
                  <div style={{ padding: 12 }}>
                    <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} style={{ ...s.input, marginBottom: 8 }} autoFocus />
                    <input type="text" value={newCollectionDescription} onChange={e => setNewCollectionDescription(e.target.value)} style={{ ...s.input, marginBottom: 0 }} placeholder="Description (optional)" />
                    <div style={{ ...s.createActions, marginTop: 8 }}>
                      <button onClick={() => { setEditingCollection(null); setNewCollectionName(''); setNewCollectionDescription('') }} style={s.cancelBtn}>Cancel</button>
                      <button onClick={() => handleUpdate(collection)} style={s.saveBtn}><Save size={11} /> Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Collection header row */}
                    <div
                      style={s.collectionHeader}
                      onClick={() => setActiveCollection(isExpanded ? null : collection)}
                      className="collection-header"
                    >
                      <div style={s.folderIcon}>
                        <Folder size={14} color="var(--accent)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.collectionName}>{collection.name}</div>
                        <div style={s.collectionMeta}>{collection.itemCount || 0} requests</div>
                      </div>
                      <div style={s.collectionActions} className="collection-actions">
                        <button onClick={e => { e.stopPropagation(); setEditingCollection(collection); setNewCollectionName(collection.name); setNewCollectionDescription(collection.description || '') }} style={s.iconBtn}><Edit3 size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(collection) }} style={{ ...s.iconBtn, color: '#ff5e5e' }}><Trash2 size={12} /></button>
                      </div>
                      {isExpanded ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
                    </div>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <>
                        {/* Action bar */}
                        <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', alignItems: 'center' }}>
                          {/* Add URL toggle */}
                          <button
                            onClick={() => {
                              if (addUrlCollectionId === collection.id) {
                                setAddUrlCollectionId(null)
                              } else {
                                setAddUrlCollectionId(collection.id)
                                setNewReqName(''); setNewReqUrl(''); setNewReqMethod('GET')
                              }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                              borderRadius: 6, border: '1px solid rgba(108,127,255,0.3)',
                              background: addUrlCollectionId === collection.id ? 'var(--accent-dim)' : 'rgba(108,127,255,0.08)',
                              color: 'var(--accent)', cursor: 'pointer',
                              fontSize: 10, fontWeight: 700, fontFamily: "'Syne', sans-serif", flexShrink: 0,
                            }}
                          >
                            <Link size={10} />
                            {addUrlCollectionId === collection.id ? 'Cancel' : 'Add URL'}
                          </button>

                          {/* Run All / Clear */}
                          {run && !isRunning ? (
                            <button
                              onClick={() => clearRunResults(collection.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                                borderRadius: 6, border: '1px solid var(--border)',
                                background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                                cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: "'Syne', sans-serif", flexShrink: 0,
                              }}
                            >
                              <X size={10} /> Clear
                            </button>
                          ) : (
                            <button
                              onClick={() => !isRunning && handleRunAll(collection)}
                              disabled={isRunning}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                                borderRadius: 6, border: '1px solid rgba(62,207,142,0.3)',
                                background: 'rgba(62,207,142,0.08)', color: '#3ecf8e',
                                cursor: isRunning ? 'not-allowed' : 'pointer',
                                fontSize: 10, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                                opacity: isRunning ? 0.6 : 1, flexShrink: 0,
                              }}
                            >
                              {isRunning
                                ? <Loader size={10} style={{ animation: 'spin 0.8s linear infinite' }} />
                                : <Play size={10} />
                              }
                              {isRunning ? 'Running…' : 'Run All'}
                            </button>
                          )}

                          {/* Live counter during run */}
                          {isRunning && (
                            <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>
                              {runResults.filter(r => r.status !== 'pending' && r.status !== 'running').length}/{runResults.length}
                            </span>
                          )}
                        </div>

                        {/* Add URL inline form */}
                        {addUrlCollectionId === collection.id && (
                          <div style={s.addUrlForm}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>New Request</div>
                            <input
                              type="text"
                              placeholder="Name (optional)"
                              value={newReqName}
                              onChange={e => setNewReqName(e.target.value)}
                              style={{ ...s.input, marginBottom: 6, fontSize: 11 }}
                            />
                            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                              <select
                                value={newReqMethod}
                                onChange={e => setNewReqMethod(e.target.value)}
                                style={{ ...s.select, color: (methodColors[newReqMethod] || {}).color || 'var(--text-primary)', fontWeight: 700, flexShrink: 0 }}
                              >
                                {HTTP_METHODS.map(m => (
                                  <option key={m} value={m} style={{ color: (methodColors[m] || {}).color, background: '#1a1d27' }}>{m}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder="https://api.example.com/endpoint"
                                value={newReqUrl}
                                onChange={e => setNewReqUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddManualUrl(collection.id)}
                                style={{ ...s.input, marginBottom: 0, flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 11 }}
                                autoFocus
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={() => setAddUrlCollectionId(null)} style={s.cancelBtn}>Cancel</button>
                              <button onClick={() => handleAddManualUrl(collection.id)} style={s.saveBtn}><Plus size={10} /> Add</button>
                            </div>
                          </div>
                        )}

                        {/* Run summary bar (shown after completion) */}
                        {run && !isRunning && (
                          <div style={s.runResultsBar}>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {runResults.filter(r => r.status === 'success').length}/{runResults.length} passed
                            </span>
                            <span style={{ fontWeight: 700, color: runResults.every(r => r.status === 'success') ? '#3ecf8e' : '#ff5e5e' }}>
                              {runResults.every(r => r.status === 'success') ? '✓ All passed' : '✗ Some failed'}
                            </span>
                          </div>
                        )}

                        {/* Request item list */}
                        <div style={s.itemList}>
                          {collection.items && collection.items.length > 0 ? (
                            collection.items.map((item, idx) => {
                              const result = runResults[idx]
                              const statusColor =
                                !result || result.status === 'pending' ? 'var(--text-muted)' :
                                result.status === 'running' ? '#f5a623' :
                                result.status === 'success' ? '#3ecf8e' : '#ff5e5e'

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => onLoadRequest(item)}
                                  style={{
                                    ...s.requestItem,
                                    background: result?.status === 'running' ? 'rgba(245,166,35,0.05)' : 'transparent',
                                    border: result?.status === 'running'
                                      ? '1px solid rgba(245,166,35,0.2)'
                                      : '1px solid transparent',
                                    transition: 'all 0.2s',
                                  }}
                                  className="request-item"
                                >
                                  <span style={s.methodBadge(item.method)}>{item.method}</span>
                                  <span style={s.requestName}>{item.name || item.url}</span>

                                  {/* Status indicator — only shown when run is active or complete */}
                                  {result && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 'auto' }}>
                                      {result.status === 'pending' && (
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>—</span>
                                      )}
                                      {result.status === 'running' && (
                                        <Loader size={11} color="#f5a623" style={{ animation: 'spin 0.8s linear infinite' }} />
                                      )}
                                      {result.status === 'success' && (
                                        <CheckCircle size={11} color="#3ecf8e" />
                                      )}
                                      {result.status === 'error' && (
                                        <XCircle size={11} color="#ff5e5e" />
                                      )}
                                      {result.httpStatus != null && (
                                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: statusColor }}>
                                          {result.httpStatus}
                                        </span>
                                      )}
                                      {result.duration != null && (
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                                          {result.duration}ms
                                        </span>
                                      )}
                                      {result.error && !result.httpStatus && (
                                        <span
                                          title={result.error}
                                          style={{ fontSize: 9, color: '#ff5e5e', fontFamily: "'DM Mono', monospace", maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                          {result.error}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)', fontSize: 11 }}>
                              No requests yet — use "Add URL" above
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Save current request to collection modal */}
      {showAddToCollection && (
        <div style={s.modal} onClick={() => setShowAddToCollection(false)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>
              Save to Collection
              <button onClick={() => setShowAddToCollection(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            {allCollections.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '16px 0' }}>Create a collection first</div>
            ) : (
              allCollections.map(collection => (
                <button key={collection.id} onClick={() => handleAddToCollection(collection)} style={s.collectionPickBtn}>
                  <div style={{ ...s.folderIcon, width: 28, height: 28 }}><Folder size={13} color="var(--accent)" /></div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{collection.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>{collection.itemCount || 0} requests</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .collection-card:hover { border-color: var(--border-focus) !important; }
        .collection-header:hover .collection-actions { opacity: 1 !important; }
        .request-item:hover { background: var(--bg-hover) !important; }
        input:focus, select:focus { border-color: var(--accent) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default CollectionsManager