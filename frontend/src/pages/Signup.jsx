import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, AlertCircle, ArrowRight } from 'lucide-react'

const FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe', id: 'signup-name' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', id: 'signup-email' },
  { key: 'password', label: 'Password', type: 'password', placeholder: '6+ characters', id: 'signup-password' },
]

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signup(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient blobs */}
      <div style={{
        position: 'fixed', bottom: '10%', right: '8%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(255,107,138,0.07) 0%, transparent 65%)',
        pointerEvents: 'none', borderRadius: '50%'
      }} />
      <div style={{
        position: 'fixed', top: '5%', left: '5%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(124,111,255,0.05) 0%, transparent 65%)',
        pointerEvents: 'none', borderRadius: '50%'
      }} />

      <div className="fade-in" style={{
        width: '100%', maxWidth: 440, padding: '44px 40px',
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 20, position: 'relative', zIndex: 1,
        boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{
            width: 38, height: 38, background: 'var(--accent)', borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--accent-glow)'
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>TaskFlow</span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Create account</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: '0.9rem' }}>Get started with your team workspace today</p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
            background: 'var(--danger-dim)', border: '1px solid rgba(255,77,109,0.25)',
            borderRadius: 9, color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 20
          }}>
            <AlertCircle size={15} strokeWidth={2.5} /> {error}
          </div>
        )}

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {FIELDS.map(({ key, label, type, placeholder, id }) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input id={id} type={type} placeholder={placeholder} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required />
            </div>
          ))}
          <button id="signup-submit" type="submit" className="btn-primary" disabled={loading} style={{
            padding: '13px', justifyContent: 'center', fontSize: '0.95rem', marginTop: 4, width: '100%'
          }}>
            {loading ? 'Creating account…' : (<>Create Account <ArrowRight size={16} /></>)}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--text2)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
