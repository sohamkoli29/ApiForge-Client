import { useState, useEffect } from 'react'
import { adminApi } from '../../api/taskApi'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminApi.getUsers().then(res => { if (res.success) setUsers(res.data) }).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#181919', marginBottom: 4 }}>Admin Panel</h2>
          <p style={{ fontSize: 14, color: '#444748' }}>{users.length} registered users</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #c4c7c7', background: '#fff', fontSize: 14, color: '#1c1b1b', fontFamily: "'Plus Jakarta Sans', sans-serif", width: 240, outline: 'none' }} onFocus={e => e.target.style.borderColor = '#181919'} onBlur={e => e.target.style.borderColor = '#c4c7c7'} />
      </div>

      <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #ebe7e7', boxShadow: '0 12px 32px rgba(45,45,45,0.05)', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 16, padding: '14px 24px', background: '#f7f3f2', borderBottom: '1px solid #ebe7e7' }}>
          {['Name', 'Email', 'Role', 'Joined'].map(h => (
            <div key={h} style={{ fontSize: 12, fontWeight: 600, color: '#444748', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#747878' }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#747878' }}>No users found</div>
        ) : (
          filtered.map((u, i) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 16, padding: '16px 24px', borderBottom: '1px solid #f1edec', background: i % 2 === 0 ? '#fff' : '#fdf8f8', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f7f3f2'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fdf8f8'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A96E, #e4c285)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1b1b' }}>{u.name}</span>
              </div>
              <span style={{ fontSize: 14, color: '#444748', alignSelf: 'center' }}>{u.email}</span>
              <div style={{ alignSelf: 'center' }}>
                <span style={{ background: u.role === 'admin' ? '#fedb9b' : '#f1edec', color: u.role === 'admin' ? '#795f2b' : '#444748', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{u.role}</span>
              </div>
              <span style={{ fontSize: 13, color: '#747878', alignSelf: 'center' }}>
                {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}