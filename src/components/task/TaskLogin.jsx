import { useState } from 'react'
import { authApi } from '../../api/taskApi'

export default function TaskLogin({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = isLogin
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register({ name: form.name, email: form.email, password: form.password })
      if (!res.success) { setError(res.error || 'Something went wrong'); return }
      localStorage.setItem('jwt_token', res.data.token)
      localStorage.setItem('jwt_user', JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#FAF8F5',
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(45,45,45,0.02) 1px, transparent 0)',
      backgroundSize: '40px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#fedb9b', filter: 'blur(80px)', opacity: 0.4, top: -80, left: -80, zIndex: 0 }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#e6e2de', filter: 'blur(80px)', opacity: 0.4, bottom: -40, right: -40, zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 440, zIndex: 1, animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: '#181919', letterSpacing: '-0.02em', marginBottom: 4 }}>AuraTask</h1>
          <p style={{ fontSize: 16, color: '#444748' }}>Your space for calm productivity.</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 24, border: '1px solid #c4c7c7',
          boxShadow: '0px 12px 32px rgba(45,45,45,0.05)', padding: 32, position: 'relative', overflow: 'hidden',
        }}>
          {/* Tab toggle */}
          <div style={{ position: 'relative', display: 'flex', background: '#f7f3f2', padding: 4, borderRadius: 12, marginBottom: 28 }}>
            <div style={{
              position: 'absolute', top: 4, left: isLogin ? 4 : 'calc(50%)', bottom: 4,
              width: 'calc(50% - 4px)', background: '#fff', borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
            }} />
            {['Login', 'Register'].map((t, i) => (
              <button key={t} onClick={() => { setIsLogin(i === 0); setError('') }} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, letterSpacing: '0.05em',
                color: (isLogin && i === 0) || (!isLogin && i === 1) ? '#181919' : '#444748',
                position: 'relative', zIndex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'color 0.3s',
              }}>{t}</button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#93000a' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: 16 }}>
                <label style={lStyle}>Full Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Alex Rivers" required style={iStyle} onFocus={e => e.target.style.borderColor = '#181919'} onBlur={e => e.target.style.borderColor = '#c4c7c7'} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={lStyle}>Email address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required style={iStyle} onFocus={e => e.target.style.borderColor = '#181919'} onBlur={e => e.target.style.borderColor = '#c4c7c7'} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={lStyle}>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" required minLength={6} style={iStyle} onFocus={e => e.target.style.borderColor = '#181919'} onBlur={e => e.target.style.borderColor = '#c4c7c7'} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#C9A96E', color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.05em',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: loading ? 'none' : '0 0 20px rgba(201,169,110,0.4)',
              opacity: loading ? 0.7 : 1,
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 24px rgba(201,169,110,0.5)' }}
              onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 0 20px rgba(201,169,110,0.4)' }}
            >
              {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#747878' }}>
          {isLogin ? "Don't have an account? " : 'Already registered? '}
          <button onClick={() => { setIsLogin(!isLogin); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#745a27', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>
            {isLogin ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        input:focus { outline: none; }
      `}</style>
    </div>
  )
}

const lStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#444748', marginBottom: 6, letterSpacing: '0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif" }
const iStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #c4c7c7', background: '#fff', fontSize: 16, color: '#1c1b1b', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'border-color 0.2s', boxSizing: 'border-box' }