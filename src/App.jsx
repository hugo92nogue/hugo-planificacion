import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import PinGate, { pinRequerido, pinDesbloqueado } from './components/PinGate'
import Dashboard from './pages/Dashboard'
import Configuracion from './pages/Configuracion'
import Registro from './pages/Registro'
import Ruta from './pages/Ruta'
import Seguimiento from './pages/Seguimiento'
import Proyector from './pages/Proyector'
import Historial from './pages/Historial'
import Movimientos from './pages/Movimientos'
import Inversiones from './pages/Inversiones'
import Reportes from './pages/Reportes'
import Mas from './pages/Mas'
import { supabaseConfigurado } from './lib/supabase'

function FaltaConfig() {
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h2>Falta configurar Supabase</h2>
        <p className="muted">
          Copiá el archivo <b>.env.example</b> como <b>.env</b> y completá{' '}
          <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> con las claves de tu
          proyecto Supabase. Después reiniciá <code>npm run dev</code>.
        </p>
        <p className="muted">El README tiene el paso a paso completo.</p>
      </div>
    </div>
  )
}

function AccesoBloqueado({ error }) {
  const esConfirmEmail = error === 'CONFIRM_EMAIL'
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h2>Casi listo…</h2>
        {esConfirmEmail ? (
          <>
            <p className="muted">
              Falta apagar la confirmación de email en Supabase para que el acceso libre funcione:
            </p>
            <ol className="muted" style={{ paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Supabase → <b>Authentication → Providers → Email</b></li>
              <li>Apagá <b>"Confirm email"</b> y tocá <b>Save</b></li>
              <li>Volvé acá y <b>recargá</b> la página</li>
            </ol>
          </>
        ) : (
          <p className="muted">No se pudo entrar automáticamente: {error || 'error desconocido'}.</p>
        )}
        <button className="btn" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { session, cargando, autoError } = useAuth()
  const [desbloqueado, setDesbloqueado] = useState(pinDesbloqueado)

  // Barrera de PIN: lo primero, antes de cargar nada.
  if (pinRequerido() && !desbloqueado) {
    return <PinGate onUnlock={() => setDesbloqueado(true)} />
  }

  if (!supabaseConfigurado) return <FaltaConfig />

  if (cargando) {
    return <div className="loader">Entrando…</div>
  }

  if (!session) {
    return <AccesoBloqueado error={autoError} />
  }

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="inversiones" element={<Inversiones />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="mas" element={<Mas />} />
          <Route path="registro" element={<Registro />} />
          <Route path="ruta" element={<Ruta />} />
          <Route path="seguimiento" element={<Seguimiento />} />
          <Route path="proyector" element={<Proyector />} />
          <Route path="historial" element={<Historial />} />
          <Route path="config" element={<Configuracion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}
