import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [modo, setModo] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const [cargando, setCargando] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    setCargando(true)
    try {
      if (modo === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
        setMsg(
          'Cuenta creada. Si tu proyecto pide confirmar el email, revisá tu correo. Si no, ya podés iniciar sesión.'
        )
        setModo('login')
      }
    } catch (e2) {
      setErr(traducirError(e2.message))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <h2 style={{ marginBottom: 4 }}>Presupuesto &amp; Patrimonio</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {modo === 'login' ? 'Iniciá sesión para ver tus datos.' : 'Creá tu cuenta personal.'}
        </p>

        {err && <div className="alerta">{err}</div>}
        {msg && <div className="ok-box mb">{msg}</div>}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </div>

        <button className="btn" disabled={cargando}>
          {cargando ? 'Procesando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <div className="center mt">
          {modo === 'login' ? (
            <button type="button" className="btn secundario" onClick={() => setModo('signup')}>
              No tengo cuenta — crear una
            </button>
          ) : (
            <button type="button" className="btn secundario" onClick={() => setModo('login')}>
              Ya tengo cuenta — iniciar sesión
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function traducirError(m = '') {
  if (/Invalid login credentials/i.test(m)) return 'Email o contraseña incorrectos.'
  if (/already registered/i.test(m)) return 'Ese email ya tiene una cuenta. Iniciá sesión.'
  if (/Password should be at least/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.'
  return m
}
