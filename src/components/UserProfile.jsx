import { useAuth } from "./AuthProvider"
import { LogOut, Settings, Shield } from "lucide-react"

export default function UserProfile() {
  const { user, signOut } = useAuth()
  const handleSignOut = async () => { try { await signOut() } catch (e) { console.error(e) } }
  if (!user) return null

  const displayName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e2e1', background: '#fdf8f8', flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #C9A96E, #e4c285)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1b1b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: '#747878', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={btnStyle} title="Settings"><Settings size={12} /></button>
        <button style={btnStyle} title="Privacy"><Shield size={12} /></button>
        <button onClick={handleSignOut} style={{ ...btnStyle, flex: 2, color: '#ba1a1a', borderColor: 'rgba(186,26,26,0.2)', background: 'rgba(186,26,26,0.04)', gap: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  )
}

const btnStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e2e1', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#444748', fontFamily: "'Plus Jakarta Sans', sans-serif" }