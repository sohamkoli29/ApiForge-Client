import { useAuth } from "./AuthProvider"
import { LogOut, User, Settings, Shield } from "lucide-react"

export default function UserProfile() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try { await signOut() } catch (error) { console.error("Sign out failed:", error) }
  }

  if (!user) return null

  const displayName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const s = {
    root: {
      padding: '10px 12px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      flexShrink: 0,
    },
    userRow: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 },
    avatar: {
      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
      background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, color: 'white',
    },
    name: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    email: { fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    actions: { display: 'flex', gap: 4 },
    btn: {
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)',
      background: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
      color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif",
    },
    signOutBtn: {
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      padding: '6px 8px', borderRadius: 7, border: '1px solid rgba(255,94,94,0.2)',
      background: 'rgba(255,94,94,0.05)', cursor: 'pointer', fontSize: 11, fontWeight: 600,
      color: 'var(--error)', fontFamily: "'Syne', sans-serif",
    },
  }

  return (
    <div style={s.root}>
      <div style={s.userRow}>
        <div style={s.avatar}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.name}>{displayName}</div>
          <div style={s.email}>{user.email}</div>
        </div>
      </div>
      <div style={s.actions}>
        <button style={s.btn} title="Settings"><Settings size={12} /></button>
        <button style={s.btn} title="Privacy"><Shield size={12} /></button>
        <button onClick={handleSignOut} style={s.signOutBtn}>
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  )
}