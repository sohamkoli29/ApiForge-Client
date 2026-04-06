import React, { useState } from 'react'
import { Plus, Folder, Edit3, Trash2, X, Save, FolderPlus, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

const methodColors = {
  GET: { color: '#3ecf8e', bg: 'rgba(62,207,142,0.1)' },
  POST: { color: '#6c7fff', bg: 'rgba(108,127,255,0.1)' },
  PUT: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
  DELETE: { color: '#ff5e5e', bg: 'rgba(255,94,94,0.1)' },
  PATCH: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
}

const CollectionsManager = ({ collections, onCreateCollection, onUpdateCollection, onDeleteCollection, onAddToCollection, currentRequest, onLoadRequest }) => {
  const [isCreating, setIsCreating] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [activeCollection, setActiveCollection] = useState(null)
  const [showAddToCollection, setShowAddToCollection] = useState(false)

  const handleCreate = async () => {
    if (!newCollectionName.trim()) { toast.error('Name required'); return }
    try {
      await onCreateCollection({ name: newCollectionName.trim(), description: newCollectionDescription.trim() || undefined })
      setNewCollectionName(''); setNewCollectionDescription(''); setIsCreating(false)
      toast.success('Collection created')
    } catch { toast.error('Failed to create') }
  }

  const handleUpdate = async (collection) => {
    if (!newCollectionName.trim()) { toast.error('Name required'); return }
    try {
      await onUpdateCollection(collection.id, { name: newCollectionName.trim(), description: newCollectionDescription.trim() || undefined })
      setEditingCollection(null); setNewCollectionName(''); setNewCollectionDescription('')
      toast.success('Updated')
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (collection) => {
    if (!window.confirm(`Delete "${collection.name}"?`)) return
    try { await onDeleteCollection(collection.id); toast.success('Deleted') }
    catch { toast.error('Failed to delete') }
  }

  const handleAddToCollection = async (collection) => {
    if (!currentRequest?.url) { toast.error('No active request'); return }
    try {
      await onAddToCollection(collection.id, {
        name: `${currentRequest.method} ${(() => { try { return new URL(currentRequest.url).pathname } catch { return currentRequest.url } })()}`,
        url: currentRequest.url, method: currentRequest.method,
        headers: JSON.stringify(currentRequest.headers), params: JSON.stringify(currentRequest.params), body: currentRequest.body,
      })
      setShowAddToCollection(false); toast.success('Saved to collection')
    } catch { toast.error('Failed to save') }
  }

  const allCollections = collections.length > 0 ? collections : []

  const s = {
    root: { height: '100%', display: 'flex', flexDirection: 'column' },
    header: {
      padding: '10px 14px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    },
    title: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' },
    headerBtns: { display: 'flex', gap: 6 },
    smallBtn: (accent) => ({
      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
      borderRadius: 7, border: `1px solid ${accent ? 'rgba(108,127,255,0.3)' : 'var(--border)'}`,
      background: accent ? 'var(--accent-dim)' : 'var(--bg-elevated)',
      color: accent ? 'var(--accent)' : 'var(--text-secondary)',
      cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'Syne', sans-serif",
    }),
    list: { flex: 1, overflowY: 'auto', padding: 10 },
    createForm: {
      padding: 14, borderRadius: 10, border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', marginBottom: 8,
    },
    createTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    input: {
      width: '100%', padding: '8px 10px', borderRadius: 8,
      border: '1px solid var(--border)', background: 'var(--bg-surface)',
      color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", fontSize: 12,
      outline: 'none', marginBottom: 8,
    },
    createActions: { display: 'flex', gap: 6, justifyContent: 'flex-end' },
    cancelBtn: {
      padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
      background: 'none', color: 'var(--text-muted)', cursor: 'pointer',
      fontSize: 11, fontWeight: 600, fontFamily: "'Syne', sans-serif",
    },
    saveBtn: {
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
      borderRadius: 7, border: 'none', cursor: 'pointer',
      background: 'var(--accent)', color: 'white',
      fontSize: 11, fontWeight: 700, fontFamily: "'Syne', sans-serif",
    },
    collectionCard: {
      borderRadius: 10, border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', marginBottom: 6, overflow: 'hidden',
    },
    collectionHeader: {
      padding: '10px 12px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
    },
    folderIcon: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--accent-dim)' },
    collectionName: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    collectionMeta: { fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" },
    collectionActions: { display: 'flex', gap: 4, opacity: 0 },
    iconBtn: {
      padding: 5, borderRadius: 6, border: 'none', cursor: 'pointer',
      background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    },
    itemList: { borderTop: '1px solid var(--border)', padding: '6px 8px' },
    requestItem: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
      borderRadius: 7, cursor: 'pointer', marginBottom: 3,
    },
    methodBadge: (method) => ({
      padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800,
      fontFamily: "'DM Mono', monospace", letterSpacing: '0.3px',
      color: (methodColors[method] || {}).color || 'var(--text-muted)',
      background: (methodColors[method] || {}).bg || 'var(--bg-elevated)',
      flexShrink: 0,
    }),
    requestName: { fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
    emptyState: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 20px', gap: 8,
    },
    emptyIcon: { width: 44, height: 44, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
    },
    modalCard: {
      width: '100%', maxWidth: 360, background: 'var(--bg-surface)',
      border: '1px solid var(--border)', borderRadius: 14, padding: 20,
    },
    modalTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    collectionPickBtn: {
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', cursor: 'pointer', marginBottom: 6, textAlign: 'left',
    },
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>Collections</span>
        <div style={s.headerBtns}>
          {currentRequest?.url && (
            <button onClick={() => setShowAddToCollection(true)} style={s.smallBtn(false)}>
              <FileText size={11} /> Save
            </button>
          )}
          <button onClick={() => setIsCreating(true)} style={s.smallBtn(true)}>
            <FolderPlus size={11} /> New
          </button>
        </div>
      </div>

      <div style={s.list}>
        {isCreating && (
          <div style={s.createForm}>
            <div style={s.createTitle}>
              New Collection
              <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <input type="text" placeholder="Collection name" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} style={s.input} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <input type="text" placeholder="Description (optional)" value={newCollectionDescription} onChange={e => setNewCollectionDescription(e.target.value)} style={{ ...s.input, marginBottom: 0 }} />
            <div style={{ ...s.createActions, marginTop: 8 }}>
              <button onClick={() => setIsCreating(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} style={s.saveBtn}><Save size={11} /> Create</button>
            </div>
          </div>
        )}

        {allCollections.length === 0 && !isCreating ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}><Folder size={20} color="var(--text-muted)" /></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>No collections</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Create a collection to<br />organize your requests</div>
          </div>
        ) : (
          allCollections.map(collection => (
            <div key={collection.id} style={s.collectionCard} className="collection-card">
              {editingCollection?.id === collection.id ? (
                <div style={{ padding: 12 }}>
                  <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} style={{ ...s.input, marginBottom: 8 }} autoFocus />
                  <input type="text" value={newCollectionDescription} onChange={e => setNewCollectionDescription(e.target.value)} style={{ ...s.input, marginBottom: 0 }} placeholder="Description (optional)" />
                  <div style={{ ...s.createActions, marginTop: 8 }}>
                    <button onClick={() => { setEditingCollection(null); setNewCollectionName(''); setNewCollectionDescription('') }} style={s.cancelBtn}>Cancel</button>
                    <button onClick={() => handleUpdate(collection)} style={s.saveBtn}><Save size={11} /> Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={s.collectionHeader}
                    onClick={() => setActiveCollection(activeCollection?.id === collection.id ? null : collection)}
                    className="collection-header"
                  >
                    <div style={s.folderIcon}>
                      <Folder size={14} color="var(--accent)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.collectionName}>{collection.name}</div>
                      <div style={s.collectionMeta}>{collection.itemCount || 0} requests</div>
                    </div>
                    <div style={s.collectionActions} className="collection-actions">
                      <button onClick={e => { e.stopPropagation(); setEditingCollection(collection); setNewCollectionName(collection.name); setNewCollectionDescription(collection.description || '') }} style={s.iconBtn}><Edit3 size={12} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(collection) }} style={{ ...s.iconBtn, color: '#ff5e5e' }}><Trash2 size={12} /></button>
                    </div>
                    {activeCollection?.id === collection.id ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
                  </div>

                  {activeCollection?.id === collection.id && collection.items && collection.items.length > 0 && (
                    <div style={s.itemList}>
                      {collection.items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => onLoadRequest(item)}
                          style={s.requestItem}
                          className="request-item"
                        >
                          <span style={s.methodBadge(item.method)}>{item.method}</span>
                          <span style={s.requestName}>{item.name || item.url}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeCollection?.id === collection.id && (!collection.items || collection.items.length === 0) && (
                    <div style={{ ...s.itemList, textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: 11 }}>
                      No requests yet
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {showAddToCollection && (
        <div style={s.modal} onClick={() => setShowAddToCollection(false)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>
              Save to Collection
              <button onClick={() => setShowAddToCollection(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            {allCollections.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '16px 0' }}>Create a collection first</div>
            ) : (
              allCollections.map(collection => (
                <button key={collection.id} onClick={() => handleAddToCollection(collection)} style={s.collectionPickBtn}>
                  <div style={{ ...s.folderIcon, width: 28, height: 28 }}><Folder size={13} color="var(--accent)" /></div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{collection.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>{collection.itemCount || 0} requests</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .collection-card:hover { border-color: var(--border-focus) !important; }
        .collection-header:hover .collection-actions { opacity: 1 !important; }
        .request-item:hover { background: var(--bg-hover) !important; }
        input:focus { border-color: var(--accent) !important; }
      `}</style>
    </div>
  )
}

export default CollectionsManager