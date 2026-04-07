import React, { useState, useEffect } from 'react'
import { Clock, Folder, Trash2, Loader, ChevronRight, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import CollectionsManager from './CollectionsManager'
import { supabase } from '../supabase'

const Sidebar = ({
  activeTab, setActiveTab, onLoadRequest, getHistory,
  collections, onCreateCollection, onUpdateCollection,
  onDeleteCollection, onAddToCollection, userId, currentRequest, user
}) => {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { loadHistory() }, [userId])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      if (userId === 'anonymous') {
        setHistory(getHistory())
        return
      }
      const { data, error } = await supabase.from('history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      setHistory((data || []).map(item => ({
        id: item.id, userId: item.user_id, url: item.url, method: item.method,
        headers: item.headers, params: item.params, body: item.body,
        responseStatus: item.response_status, duration: item.duration,
        createdAt: new Date(item.created_at).getTime()
      })))
    } catch (error) {
      setHistory(getHistory())
    } finally {
      setIsLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!window.confirm('Clear all history?')) return
    try {
      if (userId === 'anonymous') {
        const allHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
        localStorage.setItem('apiTesterHistory', JSON.stringify(allHistory.filter(i => i.userId !== userId)))
        setHistory([])
      } else {
        const { error } = await supabase.from('history').delete().eq('user_id', userId)
        if (error) throw error
        setHistory([])
      }
      toast.success('History cleared')
    } catch (error) {
      toast.error('Failed to clear history')
    }
  }

  const deleteHistoryItem = async (historyId, event) => {
    event.stopPropagation()
    try {
      if (userId === 'anonymous') {
        const allHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
        localStorage.setItem('apiTesterHistory', JSON.stringify(allHistory.filter(i => i.id !== historyId)))
        setHistory(prev => prev.filter(i => i.id !== historyId))
      } else {
        const { error } = await supabase.from('history').delete().eq('id', historyId).eq('user_id', userId)
        if (error) throw error
        setHistory(prev => prev.filter(i => i.id !== historyId))
      }
      toast.success('Removed')
    } catch (error) {
      toast.error('Failed to remove')
    }
  }

  const methodColors = {
    GET: { color: '#3ecf8e', bg: 'rgba(62,207,142,0.1)' },
    POST: { color: '#6c7fff', bg: 'rgba(108,127,255,0.1)' },
    PUT: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
    DELETE: { color: '#ff5e5e', bg: 'rgba(255,94,94,0.1)' },
    PATCH: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  }

  const statusColor = (status) => {
    if (!status) return 'var(--text-muted)'
    if (status >= 200 && status < 300) return '#3ecf8e'
    if (status >= 400) return '#ff5e5e'
    return '#38bdf8'
  }

  const formatTimestamp = (ts) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
    return `${Math.floor(diff/86400000)}d ago`
  }

  const truncateUrl = (url, max = 38) => url.length <= max ? url : url.substring(0, max) + '…'

  const s = {
    root: {
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)', overflow: 'hidden',
    },
    logo: {
      padding: '16px 16px 12px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    },
    logoIcon: {
      width: 32, height: 32, borderRadius: 9,
      background: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 16px rgba(108,127,255,0.3)',
    },
    logoText: { fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.3px' },
    logoSub: { fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.5px' },
    tabs: {
      display: 'flex', padding: '8px 12px', gap: 4,
      borderBottom: '1px solid var(--border)', flexShrink: 0,
    },
    tab: (active) => ({
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '7px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: "'Syne', sans-serif",
      background: active ? 'var(--accent-dim)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      transition: 'all 0.15s',
    }),
    badge: {
      background: 'var(--bg-elevated)', borderRadius: 99, padding: '1px 6px',
      fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    },
    content: { flex: 1, overflow: 'hidden', minHeight: 0 },
    historyWrap: { height: '65vh', display: 'flex', flexDirection: 'column' },
    historyHeader: {
      padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)', flexShrink: 0,
    },
    historyTitle: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' },
    clearBtn: {
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
      padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center',
    },
    historyList: { flex: 1, overflowY: 'auto', padding: '8px' },
    historyItem: {
      padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
      cursor: 'pointer', marginBottom: 6, position: 'relative',
      background: 'var(--bg-elevated)', transition: 'all 0.15s',
    },
    historyItemRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
    methodBadge: (method) => ({
      padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
      fontFamily: "'DM Mono', monospace", letterSpacing: '0.3px',
      ...(methodColors[method] || { color: 'var(--text-muted)', bg: 'var(--bg-elevated)' }),
      background: (methodColors[method] || {}).bg,
    }),
    url: {
      fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace",
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    metaText: { fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" },
    deleteBtn: {
      position: 'absolute', top: -6, right: -6,
      width: 18, height: 18, borderRadius: 99,
      background: '#ff5e5e', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: 0, transition: 'opacity 0.15s', color: 'white',
    },
    emptyState: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', gap: 8,
    },
    emptyIcon: {
      width: 44, height: 44, borderRadius: 12, background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    emptyText: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' },
    emptySubtext: { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' },
  }

  return (
    <div style={s.root}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoIcon}>
          <Zap size={16} color="white" />
        </div>
        <div>
          <div style={s.logoText}>ApiForge</div>
          <div style={s.logoSub}>API TESTING TOOL</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          <Clock size={13} />
          History
          {history.length > 0 && <span style={s.badge}>{history.length}</span>}
        </button>
        <button style={s.tab(activeTab === 'collections')} onClick={() => setActiveTab('collections')}>
          <Folder size={13} />
          Collections
          {collections.length > 0 && <span style={s.badge}>{collections.length}</span>}
        </button>
      </div>

      {/* Content */}
      <div style={s.content}>
        {activeTab === 'history' && (
          <div style={s.historyWrap}>
            <div style={s.historyHeader}>
              <span style={s.historyTitle}>Recent Requests</span>
              {history.length > 0 && (
                <button onClick={clearHistory} style={s.clearBtn} title="Clear history">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div style={s.historyList}>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <Loader size={20} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : history.length === 0 ? (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}><Clock size={20} color="var(--text-muted)" /></div>
                  <div style={s.emptyText}>No requests yet</div>
                  <div style={s.emptySubtext}>Your request history<br />will appear here</div>
                </div>
              ) : (
                history.map(req => (
                  <div
                    key={req.id}
                    onClick={() => { onLoadRequest(req); toast.success('Request loaded') }}
                    style={s.historyItem}
                    className="history-item"
                  >
                    <div style={s.historyItemRow}>
                      <span style={s.methodBadge(req.method)}>{req.method}</span>
                      {req.responseStatus && (
                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: statusColor(req.responseStatus) }}>
                          {req.responseStatus}
                        </span>
                      )}
                      <span style={{ ...s.metaText, marginLeft: 'auto' }}>{formatTimestamp(req.createdAt)}</span>
                    </div>
                    <div style={s.url}>{truncateUrl(req.url)}</div>
                    {req.duration && (
                      <div style={s.meta}>
                        <span style={s.metaText}>{req.duration}ms</span>
                        <ChevronRight size={11} color="var(--text-muted)" />
                      </div>
                    )}
                    <button
                      onClick={(e) => deleteHistoryItem(req.id, e)}
                      style={s.deleteBtn}
                      className="delete-btn"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div style={{ height: '100%' }}>
            <CollectionsManager
              collections={collections}
              onCreateCollection={onCreateCollection}
              onUpdateCollection={onUpdateCollection}
              onDeleteCollection={onDeleteCollection}
              onAddToCollection={onAddToCollection}
              currentRequest={currentRequest}
              onLoadRequest={onLoadRequest}
            />
          </div>
        )}
      </div>

      <style>{`
        .history-item:hover { border-color: var(--accent-dim) !important; background: var(--bg-hover) !important; }
        .history-item:hover .delete-btn { opacity: 1 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>  
    </div>
  )
}

export default Sidebar