import { useState } from "react"
import { useAuth } from "./AuthProvider"
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle } from "lucide-react"

export default function Login() {
  const { signIn, signUp, authError, clearError } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [localError, setLocalError] = useState("")

  const safeClearError = () => {
    if (clearError && typeof clearError === 'function') clearError()
    setLocalError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    safeClearError()
    setSuccessMessage("")
    try {
      if (isLogin) {
        await signIn(email, password)
        setSuccessMessage("Signed in successfully!")
      } else {
        await signUp(email, password, name)
        setSuccessMessage("Check your inbox to confirm your account.")
      }
    } catch (err) {
      if (!authError) setLocalError(err.message || "Authentication failed.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = () => { safeClearError(); setSuccessMessage(""); setIsLogin(!isLogin) }
  const displayError = authError || localError

  return (
    <div style={{
      minHeight: '100vh', background: '#FAF8F5',
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(45,45,45,0.025) 1px, transparent 0)',
      backgroundSize: '32px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#fedb9b', filter: 'blur(80px)', opacity: 0.35, top: -80, left: -80, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#e6e2de', filter: 'blur(80px)', opacity: 0.35, bottom: -40, right: -40, zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, zIndex: 1, animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #C9A96E, #e4c285)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 24px rgba(201,169,110,0.35)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#181919', letterSpacing: '-0.02em', marginBottom: 6 }}>ApiForge</h1>
          <p style={{ fontSize: 15, color: '#444748' }}>Test your APIs with confidence</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e5e2e1', boxShadow: '0 12px 32px rgba(45,45,45,0.07)', padding: 32 }}>
          {/* Tab toggle */}
          <div style={{ position: 'relative', display: 'flex', background: '#f7f3f2', padding: 4, borderRadius: 12, marginBottom: 28 }}>
            <div style={{
              position: 'absolute', top: 4, left: isLogin ? 4 : 'calc(50%)', bottom: 4,
              width: 'calc(50% - 4px)', background: '#fff', borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
            }} />
            {['Sign In', 'Sign Up'].map((t, i) => (
              <button key={t} onClick={handleFormChange} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, letterSpacing: '0.03em',
                color: (isLogin && i === 0) || (!isLogin && i === 1) ? '#181919' : '#747878',
                position: 'relative', zIndex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'color 0.3s',
              }}>{t}</button>
            ))}
          </div>

          {successMessage && (
            <div style={{ background: 'rgba(76,175,130,0.08)', border: '1px solid rgba(76,175,130,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <CheckCircle size={15} color="#4CAF82" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#2d7a57' }}>{successMessage}</span>
            </div>
          )}

          {displayError && (
            <div style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={15} color="#ba1a1a" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#ba1a1a' }}>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: 16 }}>
                <label style={lStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747878', pointerEvents: 'none' }} />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Rivers" required={!isLogin} style={iStyle}
                    onFocus={e => e.target.style.borderColor = '#181919'}
                    onBlur={e => e.target.style.borderColor = '#e5e2e1'} />
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={lStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747878', pointerEvents: 'none' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={iStyle}
                  onFocus={e => e.target.style.borderColor = '#181919'}
                  onBlur={e => e.target.style.borderColor = '#e5e2e1'} />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={lStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747878', pointerEvents: 'none' }} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} style={{ ...iStyle, paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = '#181919'}
                  onBlur={e => e.target.style.borderColor = '#e5e2e1'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#747878' }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#C9A96E', color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.03em',
              opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: isLoading ? 'none' : '0 0 20px rgba(201,169,110,0.4)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(201,169,110,0.5)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isLoading ? 'none' : '0 0 20px rgba(201,169,110,0.4)' }}
            >
              {isLoading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              {isLoading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#747878' }}>
          {isLogin ? "No account? " : "Already registered? "}
          <button onClick={handleFormChange} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#745a27', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const lStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#444748', marginBottom: 6, letterSpacing: '0.04em' }
const iStyle = { width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12, border: '1px solid #e5e2e1', background: '#fff', fontSize: 14, color: '#1c1b1b', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'border-color 0.2s', outline: 'none', boxSizing: 'border-box' }