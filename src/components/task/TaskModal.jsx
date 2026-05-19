import { useState, useEffect } from 'react'
import { tasksApi } from '../../api/taskApi'

export default function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority })
  }, [task])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = task ? await tasksApi.update(task.id, form) : await tasksApi.create(form)
      if (!res.success) { setError(res.error || 'Failed'); return }
      onSave()
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,27,27,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 24, border: '1px solid #c4c7c7', boxShadow: '0 24px 64px rgba(45,45,45,0.12)', padding: 32, animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#181919', letterSpacing: '-0.01em' }}>{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} style={{ background: '#f1edec', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {error && <div style={{ background: '#ffdad6', color: '#93000a', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={lStyle}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" required style={iStyle} onFocus={e => e.target.style.borderColor = '#181919'} onBlur={e => e.target.style.borderColor = '#c4c7c7'} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lStyle}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Add more details…" rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = '#181919'} onBlur={e => e.target.style.borderColor = '#c4c7c7'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div>
              <label style={lStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label style={lStyle}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #c4c7c7', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#444748', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#C9A96E', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: loading ? 0.7 : 1, boxShadow: '0 0 20px rgba(201,169,110,0.3)', transition: 'all 0.2s' }}>
              {loading ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

const lStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#444748', marginBottom: 6, letterSpacing: '0.05em' }
const iStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #c4c7c7', background: '#fff', fontSize: 15, color: '#1c1b1b', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'border-color 0.2s', boxSizing: 'border-box' }