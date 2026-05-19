import { useState, useEffect } from 'react'
import { tasksApi, adminApi } from '../../api/taskApi'
import TaskModal from './TaskModal'
import AdminPanel from './AdminPanel'

const priorityConfig = {
  high:   { bg: '#ffdad6', color: '#93000a', label: 'High Priority' },
  medium: { bg: '#fedb9b', color: '#795f2b', label: 'Medium Priority' },
  low:    { bg: '#d6f5e3', color: '#1a5c35', label: 'Low Priority' },
}
const statusConfig = {
  todo:        { bg: '#f1edec', color: '#444748' },
  in_progress: { bg: '#fedb9b', color: '#795f2b' },
  done:        { bg: '#d6f5e3', color: '#1a5c35' },
}

export default function TaskDashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', priority: '' })
  const [modal, setModal] = useState(null) // null | 'create' | task-object
  const [showAdmin, setShowAdmin] = useState(false)
  const [toast, setToast] = useState(null)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const active = Object.fromEntries(Object.entries(filter).filter(([, v]) => v))
      const res = await tasksApi.getAll(active)
      if (res.success) setTasks(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadTasks() }, [filter])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    const res = await tasksApi.delete(id)
    if (res.success) { showToast('Task deleted'); loadTasks() }
    else showToast(res.error, false)
  }

  const handleSave = () => { setModal(null); loadTasks(); showToast('Task saved!') }

  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length

  const filters = [
    { label: 'All', key: '', val: '' },
    { label: 'Todo', key: 'status', val: 'todo' },
    { label: 'In Progress', key: 'status', val: 'in_progress' },
    { label: 'Done', key: 'status', val: 'done' },
    null,
    { label: 'Low', key: 'priority', val: 'low' },
    { label: 'Medium', key: 'priority', val: 'medium' },
    { label: 'High', key: 'priority', val: 'high' },
  ]

  const isActive = (f) => !f.key ? (!filter.status && !filter.priority) : filter[f.key] === f.val

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 50,
          background: '#fff', borderRadius: 12, borderLeft: `4px solid ${toast.ok ? '#C9A96E' : '#ba1a1a'}`,
          padding: '14px 20px', boxShadow: '0 8px 32px rgba(45,45,45,0.12)',
          animation: 'fadeUp 0.3s ease', fontSize: 14, color: '#1c1b1b',
        }}>{toast.msg}</div>
      )}

      {/* Navbar */}
      <nav style={{
        background: '#fdf8f8', borderBottom: '1px solid #c4c7c7',
        boxShadow: '0 1px 4px rgba(45,45,45,0.04)',
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#181919', letterSpacing: '-0.01em' }}>AuraTask</span>
          <span style={{ fontSize: 14, color: '#181919', fontWeight: 700, borderBottom: '2px solid #C9A96E', paddingBottom: 2 }}>Dashboard</span>
          {user?.role === 'admin' && (
            <button onClick={() => setShowAdmin(!showAdmin)} style={{ fontSize: 14, color: '#444748', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {showAdmin ? 'Back to Tasks' : 'Admin Panel'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1b1b' }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: '#747878' }}>{user?.role}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A96E, #e4c285)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button onClick={onLogout} style={{ fontSize: 13, color: '#444748', border: '1px solid #c4c7c7', borderRadius: 8, padding: '6px 14px', background: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Logout</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 32px' }}>
        {showAdmin && user?.role === 'admin' ? <AdminPanel /> : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1c1b1b', letterSpacing: '-0.02em', marginBottom: 4 }}>{greeting}, {user?.name?.split(' ')[0]}</h1>
                <p style={{ fontSize: 18, color: '#444748' }}>{dateStr}</p>
              </div>
              <button onClick={() => setModal('create')} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#181919', color: '#fff', padding: '12px 24px',
                borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(24,25,25,0.15)',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <span style={{ fontSize: 18 }}>+</span> New Task
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 40 }}>
              {[
                { label: 'Total Tasks', value: total, bg: '#e4e2e1', icon: '📋' },
                { label: 'Completed', value: done, bg: '#fedb9b', icon: '✅' },
                { label: 'In Progress', value: inProgress, bg: '#e5e2e1', icon: '⏳' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 24, border: '1px solid #ebe7e7', boxShadow: '0 12px 32px rgba(45,45,45,0.05)', padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#444748', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#1c1b1b', letterSpacing: '-0.02em' }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              {filters.map((f, i) =>
                f === null ? <div key={i} style={{ width: 1, height: 28, background: '#c4c7c7', margin: '0 4px' }} /> : (
                  <button key={f.label} onClick={() => setFilter(f.key ? { [f.key]: f.val } : {})} style={{
                    padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${isActive(f) ? '#181919' : '#c4c7c7'}`,
                    background: isActive(f) ? '#181919' : '#fff',
                    color: isActive(f) ? '#fff' : '#444748',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}>{f.label}</button>
                )
              )}
            </div>

            {/* Tasks Grid */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ background: '#fff', borderRadius: 24, border: '1px solid #ebe7e7', padding: 24, height: 180 }}>
                    {[80, 60, 100, 40].map((w, j) => (
                      <div key={j} style={{ height: 14, background: '#f1edec', borderRadius: 8, marginBottom: 12, width: `${w}%`, animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1c1b1b', marginBottom: 8 }}>No tasks yet</div>
                <div style={{ fontSize: 16, color: '#444748' }}>Create your first task to get started</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {tasks.map(task => {
                  const p = priorityConfig[task.priority] || priorityConfig.medium
                  const s = statusConfig[task.status] || statusConfig.todo
                  return (
                    <div key={task.id} style={{
                      background: '#fff', borderRadius: 24, border: '1px solid #ebe7e7',
                      boxShadow: '0 12px 32px rgba(45,45,45,0.05)', padding: 24,
                      transition: 'all 0.3s', cursor: 'default', position: 'relative',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(45,45,45,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 32px rgba(45,45,45,0.05)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <span style={{ background: p.bg, color: p.color, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{p.label}</span>
                        <div style={{ display: 'flex', gap: 4 }} className="task-actions">
                          <button onClick={() => setModal(task)} style={iconBtn}>✏️</button>
                          <button onClick={() => handleDelete(task.id)} style={{ ...iconBtn, color: '#ba1a1a' }}>🗑️</button>
                        </div>
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1c1b1b', marginBottom: 8 }}>{task.title}</h3>
                      {task.description && <p style={{ fontSize: 14, color: '#444748', marginBottom: 20, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ebe7e7', paddingTop: 16, marginTop: 'auto' }}>
                        <span style={{ fontSize: 12, color: '#747878' }}>
                          {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {modal && <TaskModal task={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  )
}

const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 6 }