import React, { useState, useEffect } from 'react'
import { Clock, Folder, Trash2, Loader, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import CollectionsManager from './CollectionsManager'
import { supabase } from '../supabase'

const Sidebar = ({ activeTab, setActiveTab, onLoadRequest, getHistory, collections, onCreateCollection, onUpdateCollection, onDeleteCollection, onAddToCollection, userId, currentRequest, user }) => {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { loadHistory() }, [userId])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      if (userId === 'anonymous') { setHistory(getHistory()); return }
      const { data, error } = await supabase.from('history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      setHistory((data || []).map(item => ({ id: item.id, userId: item.user_id, url: item.url, method: item.method, headers: item.headers, params: item.params, body: item.body, responseStatus: item.response_status, duration: item.duration, createdAt: new Date(item.created_at).getTime() })))
    } catch { setHistory(getHistory()) }
    finally { setIsLoading(false) }
  }

  const clearHistory = async () => {
    if (!window.confirm('Clear all history?')) return
    try {
      if (userId === 'anonymous') { localStorage.setItem('apiTesterHistory', JSON.stringify(JSON.parse(localStorage.getItem('apiTesterHistory') || '[]').filter(i => i.userId !== userId))); setHistory([]) }
      else { const { error } = await supabase.from('history').delete().eq('user_id', userId); if (error) throw error; setHistory([]) }
      toast.success('History cleared')
    } catch { toast.error('Failed to clear history') }
  }

  const deleteHistoryItem = async (historyId, e) => {
    e.stopPropagation()
    try {
      if (userId === 'anonymous') { localStorage.setItem('apiTesterHistory', JSON.stringify(JSON.parse(localStorage.getItem('apiTesterHistory') || '[]').filter(i => i.id !== historyId))); setHistory(prev => prev.filter(i => i.id !== historyId)) }
      else { const { error } = await supabase.from('history').delete().eq('id', historyId).eq('user_id', userId); if (error) throw error; setHistory(prev => prev.filter(i => i.id !== historyId)) }
      toast.success('Removed')
    } catch { toast.error('Failed to remove') }
  }

  const methodColors = { GET: '#4CAF82', POST: '#C9A96E', PUT: '#795f2b', DELETE: '#ba1a1a', PATCH: '#5a6a3d' }
  const methodBg = { GET: 'rgba(76,175,130,0.1)', POST: 'rgba(201,169,110,0.12)', PUT: 'rgba(121,95,43,0.1)', DELETE: 'rgba(186,26,26,0.1)', PATCH: 'rgba(90,106,61,0.1)' }
  const statusColor = (s) => { if (!s) return '#747878'; if (s >= 200 && s < 300) return '#4CAF82'; if (s >= 400) return '#ba1a1a'; return '#C9A96E' }
  const formatTimestamp = (ts) => { const d = Date.now() - ts; if (d < 60000) return 'just now'; if (d < 3600000) return `${Math.floor(d/60000)}m ago`; if (d < 86400000) return `${Math.floor(d/3600000)}h ago`; return `${Math.floor(d/86400000)}d ago` }
  const truncateUrl = (url, max = 36) => url.length <= max ? url : url.substring(0, max) + '…'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fdf8f8', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #e5e2e1', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #C9A96E, #e4c285)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(201,169,110,0.35)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1c1b1b', letterSpacing: '-0.3px' }}>ApiForge</div>
          <div style={{ fontSize: 10, color: '#747878', fontWeight: 500, letterSpacing: '0.5px' }}>API TESTING TOOL</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '10px 12px', gap: 4, borderBottom: '1px solid #e5e2e1', flexShrink: 0 }}>
        {[{ id: 'history', icon: <Clock size={13} />, label: 'History', count: history.length }, { id: 'collections', icon: <Folder size={13} />, label: 'Collections', count: collections.length }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 10, border: activeTab === t.id ? '1px solid #e4c285' : '1px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", background: activeTab === t.id ? '#fedb9b' : 'transparent', color: activeTab === t.id ? '#795f2b' : '#747878', transition: 'all 0.15s' }}>
            {t.icon} {t.label}
            {t.count > 0 && <span style={{ background: activeTab === t.id ? 'rgba(121,95,43,0.15)' : '#f1edec', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700, color: activeTab === t.id ? '#795f2b' : '#747878' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {activeTab === 'history' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1edec', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#747878', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Recent Requests</span>
              {history.length > 0 && <button onClick={clearHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#747878', padding: 4, borderRadius: 6, display: 'flex' }}><Trash2 size={13} /></button>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Loader size={20} color="#C9A96E" style={{ animation: 'spin 1s linear infinite' }} /></div>
              ) : history.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1edec', border: '1px solid #e5e2e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={20} color="#747878" /></div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#444748' }}>No requests yet</div>
                  <div style={{ fontSize: 11, color: '#747878', textAlign: 'center' }}>Your history will appear here</div>
                </div>
              ) : (
                history.map(req => (
                  <div key={req.id} onClick={() => { onLoadRequest(req); toast.success('Request loaded') }}
                    style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e2e1', cursor: 'pointer', marginBottom: 6, position: 'relative', background: '#fff', transition: 'all 0.15s' }}
                    className="history-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: methodColors[req.method] || '#747878', background: methodBg[req.method] || '#f1edec' }}>{req.method}</span>
                      {req.responseStatus && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: statusColor(req.responseStatus) }}>{req.responseStatus}</span>}
                      <span style={{ fontSize: 10, color: '#747878', marginLeft: 'auto', fontFamily: "'DM Mono', monospace" }}>{formatTimestamp(req.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#444748', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncateUrl(req.url)}</div>
                    {req.duration && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#747878', fontFamily: "'DM Mono', monospace" }}>{req.duration}ms</span>
                      <ChevronRight size={11} color="#c4c7c7" />
                    </div>}
                    <button onClick={e => deleteHistoryItem(req.id, e)} style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 99, background: '#ba1a1a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s', color: 'white' }} className="delete-btn">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'collections' && (
          <CollectionsManager collections={collections} onCreateCollection={onCreateCollection} onUpdateCollection={onUpdateCollection} onDeleteCollection={onDeleteCollection} onAddToCollection={onAddToCollection} currentRequest={currentRequest} onLoadRequest={onLoadRequest} />
        )}
      </div>

      <style>{`
        .history-item:hover { border-color: #C9A96E !important; background: #fffdf9 !important; }
        .history-item:hover .delete-btn { opacity: 1 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default Sidebar