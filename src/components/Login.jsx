import { useState } from "react"
import { useAuth } from "./AuthProvider"
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle, Zap } from "lucide-react"

// Google SVG icon
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function Login() {
  const { signIn, signUp, signInWithGoogle, authError, clearError } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    safeClearError()
    try {
      await signInWithGoogle()
      // Page will redirect to Google — no need to do anything else
    } catch (err) {
      setLocalError(err.message || "Google sign-in failed.")
      setIsGoogleLoading(false)
    }
  }

  const handleFormChange = () => {
    safeClearError()
    setSuccessMessage("")
    setIsLogin(!isLogin)
  }

  const getErrorMessage = (error) => {
    if (!error) return null
    const map = {
      'Invalid login credentials': 'Invalid email or password.',
      'Email not confirmed': 'Please verify your email before signing in.',
      'User already registered': 'Account already exists. Please sign in.',
      'Password should be at least': 'Password must be at least 6 characters.',
      'Too many requests': 'Too many attempts. Please wait.',
    }
    for (const [key, message] of Object.entries(map)) {
      if (error.toLowerCase().includes(key.toLowerCase())) return message
    }
    return error
  }

  const displayError = authError || localError

  const s = {
    page: {
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    },
    blob1: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,127,255,0.06), transparent 70%)', top: '-10%', left: '-5%', pointerEvents: 'none' },
    blob2: { position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06), transparent 70%)', bottom: '10%', right: '5%', pointerEvents: 'none' },
    card: { width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 },
    header: { textAlign: 'center', marginBottom: 32 },
    iconWrap: { width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 24px rgba(108,127,255,0.3)' },
    title: { fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 6 },
    subtitle: { fontSize: 13, color: 'var(--text-muted)' },
    form: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 },
    toggleRow: { display: 'flex', background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, marginBottom: 24, gap: 3 },
    toggleBtn: (active) => ({ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? 'var(--accent)' : 'transparent', color: active ? 'white' : 'var(--text-muted)', fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif", boxShadow: active ? '0 0 12px rgba(108,127,255,0.3)' : 'none' }),
    alertSuccess: { padding: '10px 14px', borderRadius: 9, marginBottom: 16, background: 'var(--success-dim)', border: '1px solid rgba(62,207,142,0.2)', display: 'flex', gap: 8, alignItems: 'flex-start' },
    alertError: { padding: '10px 14px', borderRadius: 9, marginBottom: 16, background: 'var(--error-dim)', border: '1px solid rgba(255,94,94,0.2)', display: 'flex', gap: 8, alignItems: 'flex-start' },
    label: { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.7px' },
    inputWrap: { position: 'relative', marginBottom: 14 },
    inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
    input: { width: '100%', padding: '10px 12px 10px 38px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", fontSize: 13, outline: 'none' },
    eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' },
    submitBtn: { width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: 'white', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 20px rgba(108,127,255,0.3)', marginTop: 4, opacity: isLoading ? 0.7 : 1 },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
    dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
    dividerText: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' },
    googleBtn: {
      width: '100%', padding: '11px', borderRadius: 10,
      border: '1px solid var(--border)', cursor: 'pointer',
      background: 'var(--bg-elevated)', color: 'var(--text-primary)',
      fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      opacity: isGoogleLoading ? 0.7 : 1,
      transition: 'all 0.15s',
    },
    footer: { marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' },
    link: { color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 12 },
  }

  return (
    <div style={s.page}>
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.iconWrap}><Zap size={24} color="white" /></div>
          <h1 style={s.title}>ApiForge</h1>
          <p style={s.subtitle}>Test your APIs with confidence</p>
        </div>

        <div style={s.form}>
          <div style={s.toggleRow}>
            <button onClick={handleFormChange} style={s.toggleBtn(isLogin)}>Sign In</button>
            <button onClick={handleFormChange} style={s.toggleBtn(!isLogin)}>Sign Up</button>
          </div>

          {successMessage && (
            <div style={s.alertSuccess}>
              <CheckCircle size={15} color="#3ecf8e" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: '#3ecf8e' }}>{successMessage}</span>
            </div>
          )}

          {displayError && (
            <div style={s.alertError}>
              <AlertCircle size={15} color="#ff5e5e" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: '#ff5e5e' }}>{getErrorMessage(displayError)}</span>
            </div>
          )}

          {/* ── Google Button ── */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            style={s.googleBtn}
          >
            {isGoogleLoading
              ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <GoogleIcon />
            }
            {isGoogleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* ── Divider ── */}
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or continue with email</span>
            <div style={s.dividerLine} />
          </div>

          {/* ── Email/Password Form ── */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label style={s.label}>Full Name</label>
                <div style={s.inputWrap}>
                  <User size={14} style={s.inputIcon} />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={s.input} required={!isLogin} />
                </div>
              </div>
            )}
            <div>
              <label style={s.label}>Email</label>
              <div style={s.inputWrap}>
                <Mail size={14} style={s.inputIcon} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={s.input} required />
              </div>
            </div>
            <div>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <Lock size={14} style={s.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  style={{ ...s.input, paddingRight: 38 }}
                  required minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} style={s.submitBtn}>
              {isLoading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              {isLoading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {isLogin && (
            <p style={{ ...s.footer, marginTop: 12 }}>
              <button onClick={() => alert('Coming soon!')} style={s.link}>Forgot password?</button>
            </p>
          )}
        </div>

        <p style={s.footer}>
          {isLogin ? "No account? " : "Already registered? "}
          <button onClick={handleFormChange} style={s.link}>{isLogin ? "Sign up" : "Sign in"}</button>
        </p>
      </div>

      <style>{`
        input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(108,127,255,0.12) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}