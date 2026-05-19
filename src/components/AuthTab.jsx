import React, { useState } from 'react'
import { Key, User, Lock, Eye, EyeOff, Save, TestTube } from 'lucide-react'
import { toast } from 'react-hot-toast'

const AuthTab = ({ onAuthSuccess, authConfig, setAuthConfig }) => {
  const [authType, setAuthType] = useState(authConfig?.type || 'none')
  const [username, setUsername] = useState(authConfig?.username || '')
  const [password, setPassword] = useState(authConfig?.password || '')
  const [token, setToken] = useState(authConfig?.token || '')
  const [showPassword, setShowPassword] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const authTypes = [{ value:'none', label:'No Auth' }, { value:'basic', label:'Basic Auth' }, { value:'bearer', label:'Bearer Token' }, { value:'custom', label:'Custom Headers' }]

  const handleSaveAuth = () => { const c = { type:authType, username, password, token, timestamp:Date.now() }; setAuthConfig(c); localStorage.setItem('apiTesterAuthConfig', JSON.stringify(c)); toast.success('Auth saved') }
  const handleTestAuth = async () => {
    if (!authConfig) { toast.error('Save auth config first'); return }
    setIsTesting(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      if ((authConfig.type==='basic' && authConfig.username && authConfig.password) || (authConfig.type==='bearer' && authConfig.token)) { toast.success('Auth configured ✓'); onAuthSuccess(authConfig) }
      else toast.error('Invalid configuration')
    } finally { setIsTesting(false) }
  }

  const s = {
    typeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:18 },
    typeBtn: (active) => ({ padding:'8px 12px', borderRadius:10, border:`1px solid ${active ? '#C9A96E' : '#e5e2e1'}`, background: active ? '#fedb9b' : '#fff', color: active ? '#795f2b' : '#444748', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif" }),
    section: { padding:14, borderRadius:12, border:'1px solid #e5e2e1', background:'#fff', marginBottom:14 },
    sectionTitle: { fontSize:12, fontWeight:700, color:'#444748', marginBottom:12, display:'flex', alignItems:'center', gap:6 },
    label: { fontSize:10, fontWeight:700, color:'#747878', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:5, display:'block' },
    inputWrap: { position:'relative', marginBottom:10 },
    inputIcon: { position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#c4c7c7', pointerEvents:'none' },
    input: { width:'100%', padding:'8px 10px 8px 32px', borderRadius:8, border:'1px solid #e5e2e1', background:'#fdf8f8', color:'#1c1b1b', fontFamily:"'DM Mono', monospace", fontSize:12, outline:'none' },
    textarea: { width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #e5e2e1', background:'#fdf8f8', color:'#1c1b1b', fontFamily:"'DM Mono', monospace", fontSize:12, outline:'none', resize:'none', lineHeight:1.6 },
    actionRow: { display:'flex', gap:8, marginTop:4 },
    saveBtn: { display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', background:'#C9A96E', color:'white', fontSize:12, fontWeight:600, fontFamily:"'Plus Jakarta Sans', sans-serif", boxShadow:'0 0 12px rgba(201,169,110,0.3)' },
    testBtn: { display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #e5e2e1', cursor:'pointer', background:'#fff', color:'#444748', fontSize:12, fontWeight:600, fontFamily:"'Plus Jakarta Sans', sans-serif", opacity: isTesting ? 0.6 : 1 },
    statusChip: { padding:'8px 12px', borderRadius:10, border:'1px solid rgba(76,175,130,0.2)', background:'rgba(76,175,130,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  }

  return (
    <div>
      <div style={s.typeGrid}>
        {authTypes.map(t => <button key={t.value} onClick={() => setAuthType(t.value)} style={s.typeBtn(authType===t.value)}>{t.label}</button>)}
      </div>
      {authType==='basic' && (
        <div style={s.section}>
          <div style={s.sectionTitle}><Key size={13} /> Basic Authentication</div>
          <label style={s.label}>Username</label>
          <div style={s.inputWrap}><User size={13} style={s.inputIcon} /><input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" style={s.input} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} /></div>
          <label style={s.label}>Password</label>
          <div style={s.inputWrap}><Lock size={13} style={s.inputIcon} /><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" style={{...s.input,paddingRight:32}} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} /><button type="button" onClick={()=>setShowPassword(!showPassword)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#c4c7c7'}}>{showPassword?<EyeOff size={13}/>:<Eye size={13}/>}</button></div>
        </div>
      )}
      {authType==='bearer' && (
        <div style={s.section}>
          <div style={s.sectionTitle}><Key size={13} /> Bearer Token</div>
          <label style={s.label}>Token</label>
          <textarea value={token} onChange={e=>setToken(e.target.value)} placeholder="your_bearer_token_here" rows={3} style={s.textarea} onFocus={e=>e.target.style.borderColor='#C9A96E'} onBlur={e=>e.target.style.borderColor='#e5e2e1'} />
          <div style={{fontSize:10,color:'#747878',marginTop:4,fontFamily:"'DM Mono', monospace"}}>Sent as: Authorization: Bearer [token]</div>
        </div>
      )}
      {authType==='custom' && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Custom Headers</div>
          <p style={{fontSize:12,color:'#444748',lineHeight:1.6}}>Add custom auth headers in the Headers tab:<br/><code style={{fontFamily:"'DM Mono', monospace",color:'#C9A96E',fontSize:11}}>X-API-Key: your_key</code></p>
        </div>
      )}
      {authType!=='none' && (
        <div style={s.actionRow}>
          <button onClick={handleSaveAuth} style={s.saveBtn}><Save size={13}/> Save</button>
          <button onClick={handleTestAuth} disabled={isTesting} style={s.testBtn}>{isTesting?<div style={{width:13,height:13,border:'2px solid rgba(0,0,0,0.1)',borderTopColor:'#444748',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:<TestTube size={13}/>}{isTesting?'Testing…':'Test'}</button>
        </div>
      )}
      {authConfig && authConfig.type!=='none' && (
        <div style={{...s.statusChip,marginTop:14}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'#2d7a57'}}>{authConfig.type==='basic'?'Basic Auth':authConfig.type==='bearer'?'Bearer Token':'Custom Headers'} configured</div>
            <div style={{fontSize:10,color:'#747878',fontFamily:"'DM Mono', monospace"}}>{new Date(authConfig.timestamp).toLocaleString()}</div>
          </div>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#4CAF82',boxShadow:'0 0 8px rgba(76,175,130,0.5)'}}/>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default AuthTab