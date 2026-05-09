import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { CheckCircle2, Clock, AlertTriangle, Layers, FolderOpen, ArrowRight, TrendingUp } from 'lucide-react'
import { format, isPast } from 'date-fns'

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <div className="fade-in" style={{
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '22px 24px', animationDelay: `${delay}ms`, position: 'relative', overflow: 'hidden',
    transition: 'border-color 0.2s, transform 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
  >
    <div style={{
      position: 'absolute', top: -24, right: -24, width: 90, height: 90,
      background: `${color}12`, borderRadius: '50%', pointerEvents: 'none'
    }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ color: 'var(--text2)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ width: 40, height: 40, background: `${color}18`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color={color} />
      </div>
    </div>
  </div>
)

const statusColor = s => s === 'done' ? 'var(--accent3)' : s === 'in_progress' ? 'var(--accent)' : 'var(--text2)'
const statusLabel = s => s === 'in_progress' ? 'In Progress' : s === 'done' ? 'Done' : 'To Do'
const prioColor = p => p === 'high' ? 'var(--danger)' : p === 'medium' ? 'var(--warn)' : 'var(--text2)'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/tasks/dashboard'),
      api.get('/tasks/my'),
      api.get('/projects/'),
    ]).then(([s, t, p]) => {
      setStats(s.data)
      setMyTasks(t.data.slice(0, 5))
      setProjects(p.data.slice(0, 4))
    }).finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 60, borderRadius: 'var(--radius)', maxWidth: 400 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} />)}
      </div>
    </div>
  )

  const donePercent = stats?.total_tasks > 0 ? Math.round((stats.done / stats.total_tasks) * 100) : 0

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
          {greeting},{' '}
          <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Here's what's happening across your projects</p>
          {stats && stats.total_tasks > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, padding: '4px 14px' }}>
              <TrendingUp size={13} color="var(--accent3)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent3)' }}>{donePercent}% complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {stats && stats.total_tasks > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${donePercent}%` }} />
          </div>
        </div>
      )}

      {/* Stats grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 36 }}>
          <StatCard icon={Layers} label="Total Tasks" value={stats.total_tasks} color="var(--accent)" delay={0} />
          <StatCard icon={Clock} label="To Do" value={stats.todo} color="var(--text2)" delay={60} />
          <StatCard icon={ArrowRight} label="In Progress" value={stats.in_progress} color="var(--accent)" delay={120} />
          <StatCard icon={CheckCircle2} label="Done" value={stats.done} color="var(--accent3)" delay={180} />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="var(--danger)" delay={240} />
          <StatCard icon={FolderOpen} label="Projects" value={stats.total_projects} color="var(--accent2)" delay={300} />
        </div>
      )}

      {/* Two-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Tasks */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>My Tasks</h2>
            <Link to="/tasks" style={{ color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <CheckCircle2 size={28} />
              <p style={{ fontSize: '0.85rem' }}>No tasks assigned to you</p>
            </div>
          ) : myTasks.map(task => (
            <div key={task.id} style={{ padding: '11px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(task.status), marginTop: 7, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: statusColor(task.status), fontWeight: 600 }}>{statusLabel(task.status)}</span>
                  {task.due_date && (
                    <span style={{ fontSize: '0.72rem', color: isPast(new Date(task.due_date)) && task.status !== 'done' ? 'var(--danger)' : 'var(--text2)', fontFamily: 'DM Mono, monospace' }}>
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  )}
                  <span style={{ fontSize: '0.68rem', color: prioColor(task.priority), fontWeight: 700, textTransform: 'uppercase' }}>{task.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Projects</h2>
            <Link to="/projects" style={{ color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <FolderOpen size={28} />
              <p style={{ fontSize: '0.85rem' }}>No projects yet</p>
            </div>
          ) : projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                padding: '12px 0', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'opacity 0.15s'
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: `hsl(${(p.id * 47) % 360}, 55%, 32%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 800, color: '#fff',
                  border: `1px solid hsl(${(p.id * 47) % 360}, 55%, 45%)`
                }}>
                  {p.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text2)' }}>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</div>
                </div>
                <ArrowRight size={13} color="var(--text3)" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
