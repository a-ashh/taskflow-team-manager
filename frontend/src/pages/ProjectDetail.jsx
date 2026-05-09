import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { Plus, UserPlus, X, Trash2, ChevronDown } from 'lucide-react'
import { format, isPast } from 'date-fns'

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', color: 'var(--text2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--accent)' },
  { key: 'done', label: 'Done', color: 'var(--accent3)' },
]

const PRIORITIES = ['low', 'medium', 'high']
const prioColor = p => p === 'high' ? 'var(--danger)' : p === 'medium' ? 'var(--warn)' : 'var(--text2)'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('board')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' })
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [myRole, setMyRole] = useState('member')

  const fetchAll = async () => {
    const [proj, taskRes, statsRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/?project_id=${id}`),
      api.get(`/projects/${id}/dashboard`)
    ])
    setProject(proj.data)
    setTasks(taskRes.data)
    setMembers(proj.data.members)
    setStats(statsRes.data)
    const me = proj.data.members.find(m => m.user.id === user.id)
    if (me) setMyRole(me.role)
    if (proj.data.owner_id === user.id) setMyRole('admin')
  }

  useEffect(() => { fetchAll() }, [id])

  const createTask = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/tasks/', { ...taskForm, project_id: parseInt(id), assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null, due_date: taskForm.due_date || null })
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' })
      fetchAll()
    } finally { setSaving(false) }
  }

  const addMember = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post(`/projects/${id}/members`, memberForm)
      setShowMemberModal(false)
      setMemberForm({ email: '', role: 'member' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Failed to add member') }
    finally { setSaving(false) }
  }

  const updateTaskStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status })
    setTasks(t => t.map(x => x.id === taskId ? { ...x, status } : x))
  }

  const deleteTask = async taskId => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${taskId}`)
    setTasks(t => t.filter(x => x.id !== taskId))
  }

  const removeMember = async userId => {
    if (!confirm('Remove this member?')) return
    await api.delete(`/projects/${id}/members/${userId}`)
    fetchAll()
  }

  if (!project) return <div style={{ color: 'var(--text2)', paddingTop: 60, textAlign: 'center' }}>Loading…</div>

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text2)', maxWidth: 500 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {myRole === 'admin' && (
              <button onClick={() => setShowMemberModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
                borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem'
              }}>
                <UserPlus size={14} /> Add Member
              </button>
            )}
            <button onClick={() => setShowTaskModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: 'var(--accent)', border: 'none', color: '#fff',
              borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.85rem'
            }}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
            {[['Total', stats.total_tasks, 'var(--text2)'], ['To Do', stats.todo, 'var(--text2)'], ['In Progress', stats.in_progress, 'var(--accent)'], ['Done', stats.done, 'var(--accent3)'], ['Overdue', stats.overdue, 'var(--danger)']].map(([label, val, color]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['board', 'members'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '10px 18px', fontWeight: 700,
              fontSize: '0.875rem', color: tab === t ? 'var(--accent)' : 'var(--text2)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, textTransform: 'capitalize', transition: 'color 0.15s'
            }}>
              {t === 'board' ? 'Board' : `Members (${members.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Board view */}
      {tab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {STATUS_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key)
            return (
              <div key={col.key} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', background: 'var(--surface2)', borderRadius: 20, padding: '2px 8px', fontSize: '0.75rem', color: 'var(--text2)' }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {colTasks.map(task => (
                    <div key={task.id} style={{
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: 14, transition: 'border-color 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1, marginRight: 6 }}>{task.title}</span>
                        {(myRole === 'admin' || task.creator_id === user.id) && (
                          <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', padding: 0, flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {task.description && <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 8 }}>{task.description}</p>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: prioColor(task.priority), fontWeight: 700, textTransform: 'uppercase' }}>{task.priority}</span>
                        {task.assignee && <span style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>→ {task.assignee.name}</span>}
                        {task.due_date && <span style={{ fontSize: '0.72rem', color: isPast(new Date(task.due_date)) && task.status !== 'done' ? 'var(--danger)' : 'var(--text2)', fontFamily: 'DM Mono, monospace' }}>Due {format(new Date(task.due_date), 'MMM d')}</span>}
                      </div>
                      {/* Status change */}
                      <div style={{ position: 'relative' }}>
                        <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}
                          style={{ fontSize: '0.75rem', padding: '5px 8px', width: '100%' }}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Members view */}
      {tab === 'members' && (
        <div style={{ maxWidth: 600 }}>
          {members.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: `hsl(${(m.user.id * 67) % 360}, 55%, 40%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#fff'
              }}>
                {m.user.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.user.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'DM Mono, monospace' }}>{m.user.email}</div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                background: m.role === 'admin' ? 'rgba(108,99,255,0.15)' : 'var(--surface2)',
                color: m.role === 'admin' ? 'var(--accent)' : 'var(--text2)', textTransform: 'uppercase'
              }}>
                {m.role}
              </span>
              {myRole === 'admin' && m.user.id !== user.id && (
                <button onClick={() => removeMember(m.user.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="slide-left" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800 }}>New Task</h2>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)' }}><X size={20} /></button>
            </div>
            <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>TITLE</label>
                <input placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>DESCRIPTION</label>
                <textarea placeholder="Optional description" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: 70, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>PRIORITY</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>ASSIGN TO</label>
                  <select value={taskForm.assignee_id} onChange={e => setTaskForm(f => ({ ...f, assignee_id: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>DUE DATE</label>
                <input type="datetime-local" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <button type="submit" disabled={saving} style={{ padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, marginTop: 4, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Creating…' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="slide-left" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800 }}>Add Member</h2>
              <button onClick={() => setShowMemberModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)' }}><X size={20} /></button>
            </div>
            <form onSubmit={addMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>USER EMAIL</label>
                <input type="email" placeholder="teammate@example.com" value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>ROLE</label>
                <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={saving} style={{ padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Adding…' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
