import React, { useState } from 'react'
import { Clock, Copy, Expand, Minimize2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ReactJson from 'react18-json-view'

const ResponseViewer = ({ response }) => {
  const [activeView, setActiveView] = useState('body')
  const [expanded, setExpanded] = useState(false)

  if (!response) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#FAF8F5', flexDirection:'column', gap:12, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width:52, height:52, borderRadius:14, background:'#fff', border:'1px solid #e5e2e1', boxShadow:'0 4px 16px rgba(45,45,45,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4c7c7" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div style={{ fontWeight:600, fontSize:14, color:'#444748' }}>No response yet</div>
      <div style={{ fontSize:12, color:'#747878', textAlign:'center' }}>Send a request to see<br/>the response here</div>
    </div>
  )

  const isSuccess = response.status >= 200 && response.status < 300
  const isRedirect = response.status >= 300 && response.status < 400
  const isClientError = response.status >= 400 && response.status < 500
  const isServerError = response.status >= 500
  const hasHeaders = response.headers && Object.keys(response.headers).length > 0

  const statusColor = () => { if (isSuccess) return '#4CAF82'; if (isRedirect) return '#C9A96E'; if (isClientError) return '#795f2b'; if (isServerError) return '#ba1a1a'; return '#444748' }
  const statusBg = () => { if (isSuccess) return 'rgba(76,175,130,0.06)'; if (isRedirect) return 'rgba(201,169,110,0.08)'; if (isClientError) return 'rgba(121,95,43,0.06)'; if (isServerError) return 'rgba(186,26,26,0.06)'; return '#fff' }
  const statusBorder = () => { if (isSuccess) return 'rgba(76,175,130,0.2)'; if (isRedirect) return 'rgba(201,169,110,0.2)'; if (isClientError) return 'rgba(121,95,43,0.2)'; if (isServerError) return 'rgba(186,26,26,0.2)'; return '#e5e2e1' }

  const formatJSON = (obj) => { if (typeof obj === 'string') { try { return JSON.stringify(JSON.parse(obj), null, 2) } catch { return obj } } try { return JSON.stringify(obj, null, 2) } catch { return String(obj) } }
  const isJSON = (data) => { if (!data) return false; if (typeof data === 'object') return true; if (typeof data === 'string') { try { JSON.parse(data); return true } catch { return false } } return false }
  const getSize = () => { try { const str = typeof response.data === 'string' ? response.data : JSON.stringify(response.data); const size = new Blob([str]).size; if (size < 1024) return `${size} B`; if (size < 1024*1024) return `${(size/1024).toFixed(1)} KB`; return `${(size/(1024*1024)).toFixed(2)} MB` } catch { return '—' } }
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  const statusTexts = { 200:'OK', 201:'Created', 204:'No Content', 400:'Bad Request', 401:'Unauthorized', 403:'Forbidden', 404:'Not Found', 500:'Internal Server Error', 502:'Bad Gateway', 503:'Service Unavailable' }

  const renderBody = () => {
    if (!response.data) return <div style={{ color:'#747878', padding:20, textAlign:'center', fontSize:13 }}>No response body</div>
    if (isJSON(response.data)) {
      try {
        const jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
        return (
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e2e1', padding:16, minHeight:'100%' }}>
            <ReactJson src={jsonData} theme="rjv-default" collapsed={!expanded} collapseStringsAfterLength={60} displayDataTypes={false} displayObjectSize={true} enableClipboard={false} style={{ backgroundColor:'transparent', fontSize:12, fontFamily:"'DM Mono', monospace", color:'#1c1b1b' }} iconStyle="circle" indentWidth={2} quotesOnKeys={false} />
          </div>
        )
      } catch {}
    }
    return <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e2e1', padding:16, minHeight:'100%' }}><pre style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:'#1c1b1b', whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.7 }}>{formatJSON(response.data)}</pre></div>
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#FAF8F5', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
      {/* Status bar */}
      <div style={{ padding:'10px 16px', background: statusBg(), borderBottom:`1px solid ${statusBorder()}`, display:'flex', alignItems:'center', gap:12, flexShrink:0, flexWrap:'wrap' }}>
        <span style={{ fontSize:22, fontWeight:700, color:statusColor(), fontFamily:"'DM Mono', monospace", letterSpacing:'-0.5px' }}>{response.status}</span>
        <span style={{ fontSize:13, fontWeight:600, color:'#444748' }}>{response.statusText || statusTexts[response.status] || ''}</span>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8, background:'#fff', border:'1px solid #e5e2e1', fontSize:11, fontFamily:"'DM Mono', monospace", color:'#444748' }}><Clock size={11} />{response.duration}ms</span>
          <span style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8, background:'#fff', border:'1px solid #e5e2e1', fontSize:11, fontFamily:"'DM Mono', monospace", color:'#444748' }}>📦 {getSize()}</span>
        </div>
        <button onClick={() => copy(formatJSON(response.data))} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid #e5e2e1', background:'#fff', color:'#444748', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
          <Copy size={13} /> Copy
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 16px', background:'#fdf8f8', borderBottom:'1px solid #e5e2e1', flexShrink:0 }}>
        <div style={{ display:'flex', gap:2 }}>
          {['body','headers'].map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', background: activeView===v ? '#fedb9b' : 'transparent', color: activeView===v ? '#795f2b' : '#444748', fontSize:12, fontWeight:600, fontFamily:"'Plus Jakarta Sans', sans-serif", borderBottom: activeView===v ? '2px solid #C9A96E' : '2px solid transparent', textTransform:'capitalize' }}>
              {v}
              {v==='body' && isJSON(response.data) && <span style={{ padding:'2px 7px', borderRadius:5, fontSize:10, fontWeight:700, background:'rgba(76,175,130,0.1)', color:'#2d7a57', marginLeft:4 }}>JSON</span>}
              {v==='headers' && hasHeaders && <span style={{ padding:'2px 7px', borderRadius:5, fontSize:10, fontWeight:700, background:'#f1edec', color:'#747878', marginLeft:4 }}>{Object.keys(response.headers).length}</span>}
            </button>
          ))}
        </div>
        {activeView==='body' && isJSON(response.data) && (
          <button onClick={() => setExpanded(!expanded)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'1px solid #e5e2e1', background:'#fff', color:'#444748', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
            {expanded ? <Minimize2 size={12} /> : <Expand size={12} />}{expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:12 }}>
        {activeView==='body' && renderBody()}
        {activeView==='headers' && (
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e2e1', overflow:'hidden' }}>
            {hasHeaders ? (
              <div style={{ padding:'4px 16px' }}>
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} style={{ display:'flex', padding:'8px 0', borderBottom:'1px solid #f1edec', gap:12 }}>
                    <div style={{ width:'35%', fontFamily:"'DM Mono', monospace", fontSize:12, fontWeight:600, color:'#C9A96E', wordBreak:'break-all' }}>{key}</div>
                    <div style={{ flex:1, fontFamily:"'DM Mono', monospace", fontSize:12, color:'#444748', wordBreak:'break-all' }}>{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding:20, textAlign:'center', color:'#747878', fontSize:13 }}>No headers</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ResponseViewer