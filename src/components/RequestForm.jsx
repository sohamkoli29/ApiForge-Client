import React, { useState } from 'react'
import { Send, Plus, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AuthTab from './AuthTab'
import config from '../config'

const methodColors = { GET: '#4CAF82', POST: '#C9A96E', PUT: '#795f2b', DELETE: '#ba1a1a', PATCH: '#5a6a3d' }

const RequestForm = ({ onResponse, onSaveRequest, currentRequest }) => {
  const [activeTab, setActiveTab] = useState('params')
  const [method, setMethod] = useState(currentRequest?.method || 'GET')
  const [url, setUrl] = useState(currentRequest?.url || '')
  const [headers, setHeaders] = useState(() => { if (!currentRequest?.headers) return [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }]; if (Array.isArray(currentRequest.headers)) return currentRequest.headers; try { return JSON.parse(currentRequest.headers) } catch { return [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }] } })
  const [params, setParams] = useState(() => { if (!currentRequest?.params) return [{ id: 1, key: '', value: '', enabled: true }]; if (Array.isArray(currentRequest.params)) return currentRequest.params; try { return JSON.parse(currentRequest.params) } catch { return [{ id: 1, key: '', value: '', enabled: true }] } })
  const [body, setBody] = useState(currentRequest?.body || '{\n  \n}')
  const [jsonError, setJsonError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authConfig, setAuthConfig] = useState(() => { try { return JSON.parse(localStorage.getItem('apiTesterAuthConfig') || 'null') } catch { return null } })

  const tabs = [{ id: 'params', label: 'Params' }, { id: 'headers', label: 'Headers' }, { id: 'body', label: 'Body', disabled: method === 'GET' }, { id: 'auth', label: 'Auth' }]

  React.useEffect(() => {
    if (currentRequest) {
      setUrl(currentRequest.url || ''); setMethod(currentRequest.method || 'GET')
      if (currentRequest.headers) { if (Array.isArray(currentRequest.headers)) setHeaders(currentRequest.headers); else try { setHeaders(JSON.parse(currentRequest.headers)) } catch { setHeaders([{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }]) } }
      if (currentRequest.params) { if (Array.isArray(currentRequest.params)) setParams(currentRequest.params); else try { setParams(JSON.parse(currentRequest.params)) } catch { setParams([{ id: 1, key: '', value: '', enabled: true }]) } }
      setBody(currentRequest.body || '{\n  \n}')
    }
  }, [currentRequest])

  React.useEffect(() => { if (method === 'GET' && activeTab === 'body') setActiveTab('params') }, [method, activeTab])

  const addHeader = () => setHeaders([...headers, { id: Date.now(), key: '', value: '', enabled: true }])
  const removeHeader = (id) => { if (headers.length > 1) setHeaders(headers.filter(h => h.id !== id)) }
  const updateHeader = (id, field, value) => setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h))
  const toggleHeader = (id) => setHeaders(headers.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h))
  const addParam = () => setParams([...params, { id: Date.now(), key: '', value: '', enabled: true }])
  const removeParam = (id) => { if (params.length > 1) setParams(params.filter(p => p.id !== id)) }
  const updateParam = (id, field, value) => setParams(params.map(p => p.id === id ? { ...p, [field]: value } : p))
  const toggleParam = (id) => setParams(params.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))

  const validateJSON = (jsonString) => { try { if (jsonString.trim()) JSON.parse(jsonString); setJsonError(''); return true } catch (e) { setJsonError(e.message); return false } }

  const buildUrlWithParams = () => {
    if (!url) return url
    try { const u = new URL(url); u.search = ''; (Array.isArray(params) ? params.filter(p => p.enabled && p.key?.trim()) : []).forEach(p => { if (p.key && p.value) u.searchParams.append(p.key, p.value) }); return u.toString() } catch { return url }
  }

  const handleSend = async () => {
    if (!url.trim()) { toast.error('Enter a URL'); return }
    try { new URL(url) } catch { toast.error('Enter a valid URL (include https://)'); return }
    if (method !== 'GET' && body.trim() && !validateJSON(body)) { toast.error('Fix JSON errors first'); return }
    setIsLoading(true)
    try {
      const enabledHeaders = Array.isArray(headers) ? headers.filter(h => h.enabled && h.key?.trim()).reduce((acc, h) => { acc[h.key] = h.value; return acc }, {}) : {}
      if (authConfig && authConfig.type !== 'none') {
        if (authConfig.type === 'basic' && authConfig.username && authConfig.password) enabledHeaders['Authorization'] = `Basic ${btoa(`${authConfig.username}:${authConfig.password}`)}`
        else if (authConfig.type === 'bearer' && authConfig.token) enabledHeaders['Authorization'] = `Bearer ${authConfig.token.trim()}`
      }
      let requestBody = null
      if (method !== 'GET' && body.trim()) { try { requestBody = JSON.parse(body) } catch { throw new Error('Invalid JSON body') } }
      const startTime = Date.now()
      const response = await fetch(`${config.apiUrl}/api/proxy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: buildUrlWithParams(), method: method.toUpperCase(), headers: enabledHeaders, body: requestBody, timeout: 30000, auth: authConfig }) })
      const result = await response.json()
      const finalResult = { ...result, duration: result.duration || (Date.now() - startTime) }
      if (response.ok) {
        onResponse(finalResult)
        if (onSaveRequest) onSaveRequest({ url, method, headers: JSON.stringify(Array.isArray(headers) ? headers.filter(h => h.enabled && h.key) : []), body: method !== 'GET' ? body : null, params: JSON.stringify(Array.isArray(params) ? params.filter(p => p.enabled && p.key) : []), responseStatus: finalResult.status, timestamp: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(), duration: finalResult.duration })
        finalResult.status >= 200 && finalResult.status < 300 ? toast.success(`${finalResult.status} · ${finalResult.duration}ms`) : toast.error(`${finalResult.status} · ${finalResult.duration}ms`)
      } else {
        onResponse({ status: response.status, statusText: response.statusText, headers: {}, data: { error: result.error || 'Proxy error' }, duration: Date.now() - startTime })
        toast.error(result.error || 'Request failed')
      }
    } catch (error) { onResponse({ status: 0, statusText: 'Error', headers: {}, data: { error: error.message }, duration: 0 }); toast.error('Network error — check backend') }
    finally { setIsLoading(false) }
  }

  const s = {
    root: { height: '100%', display: 'flex', flexDirection: 'column', background: '#FAF8F5', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    urlBar: { padding: '12px 16px', background: '#fdf8f8', borderBottom: '1px solid #e5e2e1', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
    methodSelect: { padding: '9px 10px', borderRadius: 10, border: '1px solid #e5e2e1', background: '#fff', color: methodColors[method] || '#1c1b1b', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', minWidth: 90, appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23747878' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 28 },
    urlInput: { flex: 1, minWidth: 200, padding: '9px 13px', borderRadius: 10, border: '1px solid #e5e2e1', background: '#fff', color: '#1c1b1b', fontFamily: "'DM Mono', monospace", fontSize: 12, outline: 'none' },
    sendBtn: { padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isLoading ? '#e4c285' : '#C9A96E', color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', opacity: isLoading ? 0.7 : 1, boxShadow: isLoading ? 'none' : '0 0 16px rgba(201,169,110,0.35)', transition: 'all 0.15s' },
    tabBar: { display: 'flex', gap: 2, padding: '8px 16px', background: '#fdf8f8', borderBottom: '1px solid #e5e2e1' },
    tab: (active, disabled) => ({ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: active ? '#fedb9b' : 'transparent', color: disabled ? '#c4c7c7' : active ? '#795f2b' : '#444748', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: active ? '2px solid #C9A96E' : '2px solid transparent', opacity: disabled ? 0.4 : 1 }),
    tabContent: { flex: 1, overflowY: 'auto', padding: '16px', background: '#FAF8F5' },
    tableHeader: { display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 8, padding: '0 4px 8px', fontSize: 10, fontWeight: 700, color: '#747878', textTransform: 'uppercase', letterSpacing: '0.8px' },
    tableRow: { display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 8, padding: '6px 4px', borderRadius: 10, alignItems: 'center', background: '#fff', border: '1px solid #e5e2e1', marginBottom: 6 },
    input: { padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e2e1', background: '#fdf8f8', color: '#1c1b1b', fontFamily: "'DM Mono', monospace", fontSize: 12, outline: 'none', width: '100%' },
    checkbox: { width: 16, height: 16, accentColor: '#C9A96E', cursor: 'pointer', margin: 'auto' },
    removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#c4c7c7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, padding: 4, margin: 'auto' },
    addBtn: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '7px 12px', borderRadius: 8, border: '1px dashed #c4c7c7', background: 'none', color: '#747878', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" },
    bodyArea: { width: '100%', height: 260, padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e2e1', background: '#fff', color: '#1c1b1b', fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.6, resize: 'vertical', outline: 'none' },
    sectionTitle: { fontSize: 11, fontWeight: 700, color: '#747878', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  }

  return (
    <div style={s.root}>
      <div style={s.urlBar}>
        <select value={method} onChange={e => setMethod(e.target.value)} style={s.methodSelect}>
          {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m} value={m} style={{ color: methodColors[m], background: '#fff' }}>{m}</option>)}
        </select>
        <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="https://api.example.com/endpoint" style={s.urlInput} onFocus={e => e.target.style.borderColor='#C9A96E'} onBlur={e => e.target.style.borderColor='#e5e2e1'} />
        <button onClick={handleSend} disabled={isLoading} style={s.sendBtn}>
          {isLoading ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
          {isLoading ? 'Sending…' : 'Send'}
        </button>
      </div>

      <div style={s.tabBar}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => !t.disabled && setActiveTab(t.id)} style={s.tab(activeTab === t.id, t.disabled)}>
            {t.label}{t.id === 'body' && method === 'GET' && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.5 }}>N/A</span>}
          </button>
        ))}
      </div>

      <div style={s.tabContent}>
        {activeTab === 'params' && (
          <div>
            <div style={s.sectionTitle}>Query Parameters</div>
            <div style={s.tableHeader}><div style={{ textAlign:'center' }}>On</div><div>Key</div><div>Value</div><div /></div>
            {Array.isArray(params) && params.map(p => (
              <div key={p.id} style={s.tableRow}>
                <input type="checkbox" checked={p.enabled} onChange={() => toggleParam(p.id)} style={s.checkbox} />
                <input type="text" placeholder="key" value={p.key} onChange={e => updateParam(p.id,'key',e.target.value)} style={s.input} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} />
                <input type="text" placeholder="value" value={p.value} onChange={e => updateParam(p.id,'value',e.target.value)} style={s.input} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} />
                <button onClick={() => removeParam(p.id)} style={s.removeBtn}><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={addParam} style={s.addBtn}><Plus size={13} /> Add Parameter</button>
            {Array.isArray(params) && params.some(p => p.enabled && p.key) && (
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#fff', border: '1px solid #e5e2e1' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#747878', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Generated URL</div>
                <code style={{ fontSize: 11, color: '#C9A96E', fontFamily: "'DM Mono', monospace", wordBreak: 'break-all' }}>{buildUrlWithParams()}</code>
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div>
            <div style={s.sectionTitle}>Request Headers</div>
            <div style={s.tableHeader}><div style={{ textAlign:'center' }}>On</div><div>Header</div><div>Value</div><div /></div>
            {Array.isArray(headers) && headers.map(h => (
              <div key={h.id} style={s.tableRow}>
                <input type="checkbox" checked={h.enabled} onChange={() => toggleHeader(h.id)} style={s.checkbox} />
                <input type="text" placeholder="Content-Type" value={h.key} onChange={e => updateHeader(h.id,'key',e.target.value)} style={s.input} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} />
                <input type="text" placeholder="application/json" value={h.value} onChange={e => updateHeader(h.id,'value',e.target.value)} style={s.input} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} />
                <button onClick={() => removeHeader(h.id)} style={s.removeBtn}><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={addHeader} style={s.addBtn}><Plus size={13} /> Add Header</button>
          </div>
        )}

        {activeTab === 'body' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={s.sectionTitle}>Request Body</div>
              <div style={{ display:'flex', gap:8 }}>
                {['Beautify','Minify'].map(action => (
                  <button key={action} onClick={() => { try { const p = JSON.parse(body); setBody(action==='Beautify' ? JSON.stringify(p,null,2) : JSON.stringify(p)); setJsonError(''); if(action==='Beautify') toast.success('Formatted') } catch { toast.error('Invalid JSON') } }} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #e5e2e1', background:'#fff', color:'#444748', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{action}</button>
                ))}
              </div>
            </div>
            <textarea value={body} onChange={e => { setBody(e.target.value); validateJSON(e.target.value) }} style={s.bodyArea} placeholder={'{\n  "key": "value"\n}'} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} />
            {jsonError && <div style={{ marginTop:8, padding:'8px 12px', borderRadius:10, background:'rgba(186,26,26,0.06)', border:'1px solid rgba(186,26,26,0.2)', color:'#ba1a1a', fontSize:12, fontFamily:"'DM Mono', monospace" }}>✗ {jsonError}</div>}
            {body.trim() && !jsonError && <div style={{ marginTop:8, padding:'8px 12px', borderRadius:10, background:'rgba(76,175,130,0.08)', border:'1px solid rgba(76,175,130,0.2)', color:'#2d7a57', fontSize:12, display:'flex', alignItems:'center', gap:6 }}><CheckCircle size={13} /> Valid JSON</div>}
          </div>
        )}

        {activeTab === 'auth' && (
          <div>
            <div style={s.sectionTitle}>Authentication</div>
            <AuthTab onAuthSuccess={setAuthConfig} authConfig={authConfig} setAuthConfig={setAuthConfig} />
          </div>
        )}
      </div>

      <style>{`
        input[type="text"]:focus, textarea:focus { border-color: #C9A96E !important; box-shadow: 0 0 0 3px rgba(201,169,110,0.12) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default RequestForm