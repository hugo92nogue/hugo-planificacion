import { useState } from 'react'

const PIN = import.meta.env.VITE_APP_PIN
const CLAVE_LS = 'pin_unlocked'

// ¿Hay PIN configurado?
export function pinRequerido() {
  return Boolean(PIN)
}

// ¿Ya está desbloqueado en este dispositivo?
export function pinDesbloqueado() {
  if (!pinRequerido()) return true
  try {
    return localStorage.getItem(CLAVE_LS) === String(PIN)
  } catch {
    return false
  }
}

export default function PinGate({ onUnlock }) {
  const [valor, setValor] = useState('')
  const [error, setError] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (valor === String(PIN)) {
      try {
        localStorage.setItem(CLAVE_LS, String(PIN))
      } catch {
        /* sin localStorage igual entra esta sesión */
      }
      onUnlock()
    } else {
      setError(true)
      setValor('')
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="center" style={{ fontSize: '2.4rem' }}>🔒</div>
        <h2 className="center" style={{ marginTop: 6 }}>Ingresá tu PIN</h2>
        <p className="muted center" style={{ marginTop: 0 }}>
          Presupuesto &amp; Patrimonio
        </p>

        {error && <div className="alerta">PIN incorrecto. Probá de nuevo.</div>}

        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          autoFocus
          value={valor}
          onChange={(e) => {
            setError(false)
            setValor(e.target.value.replace(/\D/g, ''))
          }}
          placeholder="••••"
          style={{
            textAlign: 'center',
            fontSize: '1.8rem',
            letterSpacing: '0.4rem',
            fontWeight: 700,
          }}
        />

        <button className="btn mt" type="submit" disabled={valor.length < 3}>
          Entrar
        </button>
      </form>
    </div>
  )
}
