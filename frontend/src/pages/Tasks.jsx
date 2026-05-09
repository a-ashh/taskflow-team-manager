import { useState, useEffect } from 'react'
import api from '../api'
import { format, isPast } from 'date-fns'
import { CheckSquare, AlertTriangle, Clock, ListFilter } from 'lucide-react'

const prioColor = p => p === 'high' ? 'var(--danger)' : p === 'medium' ? 'var(--warn)' : 'var(--text2)'
const prioBg = p => p === 'high' ? 'var(--danger-dim)' : p === 'medium' ? 'var(--warn-dim)' : 'var(--surface3)'
const statusColor = s => s === 'done' ? 'var(--accent3)' : s === 'in_progress' ? 'var(--accent)' : 'var(--text2)'
const statusBg = s => s === 'done' ? 'var(--accent3-dim)' : s === 'in_progress' ? 'var(--accent-dim)' : 'var(--surface3)'
const statusLabel = s => s === 'in_progress' ? 'In Progress' : s === 'done' ? 'Done' : 'To Do'

const FILTERS = [
  { key: 'all', label: 'All Tasks', icon: ListFilter },
  { key: 'my', label: 'Assigned to Me', icon: Clock },
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle },
]

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const endpoint = filter === 'my' ? '/tasks/my' : filter === 'overdue' ? '/tasks/overdue' : '/tasks/'
      const { data } = await api.get(endpoint)
      setTasks(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks() }, [filter])

  const updateStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status })
    setTasks(t => t.map(x => x.id === taskId ? { ...x, status } : x))
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Tasks</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Track and manage tasks across all your projects</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button key={key} id={`filter-${key}`} onClick={() => setFilter(key)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            background: filter === key ? 'var(--accent)' : 'var(--surface)',
            border: `1px solid ${filter === key ? 'var(--accent)' : 'var(--border)'}`,
            color: filter === key ? '#fff' : 'var(--text2)',
            borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem',
            transition: 'all 0.18s', fontFamily: 'Syne, sans-serif',
            boxShadow: filter === key ? 'var(--shadow-accent)' : 'none',
          }}>
            <Icon size={13} strokeWidth={2.5} />{label}
            {filter === key && tasks.length > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 999, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 800 }}>
                {tasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-sm)' }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state card" style={{ padding: '64px 24px' }}>
          <CheckSquare size={44} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No tasks found</p>
          <p style={{ fontSize: '0.85rem' }}>
            {filter === 'overdue' ? 'Great — no overdue tasks!' :
             filter === 'my' ? "No tasks assigned to you yet" : 'No tasks across your projects yet'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 100px 110px 140px',
            padding: '11px 20px', borderBottom: '1px solid var(--border)',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text2)', textTransform: 'uppercase'
          }}>
            <span>Task</span><span style={{ textAlign: 'center' }}>Priority</span>
            <span style={{ textAlign: 'center' }}>Due Date</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Change</span>
          </div>
          {tasks.map((task, i) => {
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
            return (
              <div key={task.id} className="fade-in" style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 100px 110px 140px',
                alignItems: 'center', padding: '14px 20px',
                borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s', animationDelay: `${i * 35}ms`,
                background: isOverdue ? 'rgba(255,77,109,0.03)' : 'transparent'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = isOverdue ? 'rgba(255,77,109,0.03)' : 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isOverdue && <AlertTriangle size={12} color="var(--danger)" />}
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'var(--text2)' }}>
                    {task.assignee && <span>→ {task.assignee.name}</span>}
                    {task.creator && <span style={{ color: 'var(--text3)' }}>by {task.creator.name}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', background: prioBg(task.priority), color: prioColor(task.priority) }}>
                    {task.priority}
                  </span>
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.78rem', fontFamily: 'DM Mono, monospace', color: isOverdue ? 'var(--danger)' : 'var(--text2)' }}>
                  {task.due_date ? format(new Date(task.due_date), 'MMM d') : '—'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: statusBg(task.status), color: statusColor(task.status) }}>
                    {statusLabel(task.status)}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} style={{ fontSize: '0.78rem', padding: '6px 10px', width: '100%' }}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
