import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Plus, FolderOpen, Users, Trash2, X, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchProjects = () => api.get('/projects/').then(r => setProjects(r.data)).finally(() => setLoading(false))
  useEffect(() => { fetchProjects() }, [])

  const create = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/projects/', form)
      setShowModal(false)
      setForm({ name: '', description: '' })
      fetchProjects()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project')
    } finally { setSaving(false) }
  }

  const deleteProject = async (e, id) => {
    e.preventDefault()
    if (!confirm('Delete this project and all its tasks?')) return
    await api.delete(`/projects/${id}`)
    setProjects(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            {loading ? '…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} in your workspace`}
          </p>
        </div>
        <button id="btn-new-project" onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} strokeWidth={2.5} /> New Project
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state card" style={{ padding: '80px 24px' }}>
          <FolderOpen size={48} />
          <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>No projects yet</p>
          <p>Create your first project to start tracking tasks</p>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ marginTop: 8 }}>
            <Plus size={15} /> Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {projects.map((p, i) => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card fade-in" style={{
                padding: 24, cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                animationDelay: `${i * 55}ms`, position: 'relative', overflow: 'hidden'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `hsl(${(p.id*47)%360},65%,55%)`; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Color accent top bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `hsl(${(p.id*47)%360},65%,55%)` }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: `hsl(${(p.id*47)%360},55%,28%)`,
                      border: `1px solid hsl(${(p.id*47)%360},55%,42%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.95rem', fontWeight: 800, color: '#fff'
                    }}>
                      {p.name[0].toUpperCase()}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, flex: 1, marginRight: 4 }}>{p.name}</h3>
                  </div>
                  <button onClick={e => deleteProject(e, p.id)} style={{
                    background: 'transparent', border: 'none', color: 'var(--text3)', padding: 4,
                    borderRadius: 6, transition: 'color 0.15s', flexShrink: 0
                  }}
                    onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--danger)' }}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {p.description && (
                  <p style={{ color: 'var(--text2)', fontSize: '0.83rem', marginBottom: 16, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text2)', marginTop: p.description ? 0 : 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={11} /> {p.members.length} member{p.members.length !== 1 ? 's' : ''}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>{format(new Date(p.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box slide-up" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>New Project</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16 }}>
                {error}
              </div>
            )}
            <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Project Name</label>
                <input id="project-name" placeholder="My awesome project" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Description (optional)</label>
                <textarea id="project-desc" placeholder="What's this project about?" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ minHeight: 80, resize: 'vertical' }} />
              </div>
              <button id="btn-create-project" type="submit" className="btn-primary" disabled={saving} style={{ padding: '12px', justifyContent: 'center', width: '100%', marginTop: 4 }}>
                {saving ? 'Creating…' : (<><Plus size={15} /> Create Project</>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
