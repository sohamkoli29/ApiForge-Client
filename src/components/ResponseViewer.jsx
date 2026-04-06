import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, Copy, AlertCircle, Expand, Minimize2, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ReactJson from 'react18-json-view'

const ResponseViewer = ({ response }) => {
  const [activeView, setActiveView] = useState('body')
  const [expanded, setExpanded] = useState(false)

  if (!response) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={22} color="var(--text-muted)" />
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>No response yet</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Send a request to see<br />the response here</div>
      </div>
    )
  }

  const isSuccess = response.status >= 200 && response.status < 300
  const isRedirect = response.status >= 300 && response.status < 400
  const isClientError = response.status >= 400 && response.status < 500
  const isServerError = response.status >= 500
  const hasHeaders = response.headers && Object.keys(response.headers).length > 0

  const statusColor = () => {
    if (isSuccess) return '#3ecf8e'
    if (isRedirect) return '#38bdf8'
    if (isClientError) return '#f5a623'
    if (isServerError) return '#ff5e5e'
    return 'var(--text-secondary)'
  }

  const statusBg = () => {
    if (isSuccess) return 'rgba(62,207,142,0.08)'
    if (isRedirect) return 'rgba(56,189,248,0.08)'
    if (isClientError) return 'rgba(245,166,35,0.08)'
    if (isServerError) return 'rgba(255,94,94,0.08)'
    return 'var(--bg-elevated)'
  }

  const statusBorder = () => {
    if (isSuccess) return 'rgba(62,207,142,0.2)'
    if (isRedirect) return 'rgba(56,189,248,0.2)'
    if (isClientError) return 'rgba(245,166,35,0.2)'
    if (isServerError) return 'rgba(255,94,94,0.2)'
    return 'var(--border)'
  }

  const formatJSON = (obj) => {
    if (typeof obj === 'string') { try { return JSON.stringify(JSON.parse(obj), null, 2) } catch { return obj } }
    try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
  }

  const isJSON = (data) => {
    if (!data) return false
    if (typeof data === 'object') return true
    if (typeof data === 'string') { try { JSON.parse(data); return true } catch { return false } }
    return false
  }

  const getSize = () => {
    try {
      const str = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      const size = new Blob([str]).size
      if (size < 1024) return `${size} B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    } catch { return '—' }
  }

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  const statusTexts = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 408: 'Timeout', 409: 'Conflict', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout' }

  const s = {
    root: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' },
    statusBar: {
      padding: '10px 16px',
      background: statusBg(),
      borderBottom: `1px solid ${statusBorder()}`,
      display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      flexWrap: 'wrap',
    },
    statusCode: { fontSize: 20, fontWeight: 800, color: statusColor(), fontFamily: "'DM Mono', monospace", letterSpacing: '-0.5px' },
    statusText: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' },
    metaChip: {
      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
      borderRadius: 6, background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', fontSize: 11,
      fontFamily: "'DM Mono', monospace", color: 'var(--text-secondary)',
    },
    copyBtn: {
      marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
      cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Syne', sans-serif",
    },
    tabBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 16px', background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)', flexShrink: 0,
    },
    tabs: { display: 'flex', gap: 2 },
    tab: (active) => ({
      padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
      background: active ? 'var(--bg-elevated)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      fontSize: 12, fontWeight: 600, fontFamily: "'Syne', sans-serif",
      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    }),
    badge: {
      padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
      background: 'var(--bg-elevated)', color: 'var(--text-muted)', marginLeft: 4,
    },
    toggleBtn: {
      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
      borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-elevated)',
      color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11,
      fontWeight: 600, fontFamily: "'Syne', sans-serif",
    },
    bodyWrap: { flex: 1, overflow: 'auto', padding: '12px' },
    jsonWrap: { background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', padding: 14, minHeight: '100%' },
    pre: {
      fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-primary)',
      whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.7,
    },
    headerRow: { display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 12 },
    headerKey: { width: '35%', fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-all' },
    headerVal: { flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' },
  }

  const renderBody = () => {
    if (!response.data) return <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center', fontSize: 13 }}>No response body</div>

    if (isJSON(response.data)) {
      try {
        const jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
        return (
          <div style={s.jsonWrap}>
            <ReactJson
              src={jsonData}
              theme="rjv-default"
              collapsed={!expanded}
              collapseStringsAfterLength={60}
              displayDataTypes={false}
              displayObjectSize={true}
              enableClipboard={false}
              onCopy={(copy) => { navigator.clipboard.writeText(JSON.stringify(copy.src, null, 2)); toast.success('Copied!') }}
              style={{ backgroundColor: 'transparent', fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--text-primary)' }}
              iconStyle="circle"
              indentWidth={2}
              quotesOnKeys={false}
            />
          </div>
        )
      } catch {}
    }

    return (
      <div style={s.jsonWrap}>
        <pre style={s.pre}>{formatJSON(response.data)}</pre>
      </div>
    )
  }

  return (
    <div style={s.root}>
      {/* Status Bar */}
      <div style={s.statusBar}>
        <span style={s.statusCode}>{response.status}</span>
        <span style={s.statusText}>{response.statusText || statusTexts[response.status] || ''}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={s.metaChip}><Clock size={11} />{response.duration}ms</span>
          <span style={s.metaChip}>📦 {getSize()}</span>
        </div>
        <button onClick={() => copy(formatJSON(response.data))} style={s.copyBtn}>
          <Copy size={13} /> Copy
        </button>
      </div>

      {/* Tab Bar */}
      <div style={s.tabBar}>
        <div style={s.tabs}>
          <button onClick={() => setActiveView('body')} style={s.tab(activeView === 'body')}>
            Body
            {isJSON(response.data) && <span style={{ ...s.badge, color: '#3ecf8e', background: 'rgba(62,207,142,0.1)' }}>JSON</span>}
          </button>
          <button onClick={() => setActiveView('headers')} style={s.tab(activeView === 'headers')}>
            Headers
            {hasHeaders && <span style={s.badge}>{Object.keys(response.headers).length}</span>}
          </button>
        </div>
        {activeView === 'body' && isJSON(response.data) && (
          <button onClick={() => setExpanded(!expanded)} style={s.toggleBtn}>
            {expanded ? <Minimize2 size={12} /> : <Expand size={12} />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={s.bodyWrap}>
        {activeView === 'body' && renderBody()}
        {activeView === 'headers' && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {hasHeaders ? (
              <div style={{ padding: '4px 14px' }}>
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} style={s.headerRow}>
                    <div style={s.headerKey}>{key}</div>
                    <div style={s.headerVal}>{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No headers</div>
            )}
          </div>
        )}
      </div>

      <style>{`
        /* Override react18-json-view colors for dark theme */
        .rjv-default .json-string { color: #3ecf8e !important; }
        .rjv-default .json-number { color: #f5a623 !important; }
        .rjv-default .json-boolean { color: #6c7fff !important; }
        .rjv-default .json-null { color: #ff5e5e !important; }
        .rjv-default .json-key { color: #38bdf8 !important; }
      `}</style>
    </div>
  )
}

export default ResponseViewer