import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Configuracion from './pages/Configuracion'
import Registro from './pages/Registro'
import Ruta from './pages/Ruta'
import Seguimiento from './pages/Seguimiento'
import Proyector from './pages/Proyector'
import Historial from './pages/Historial'
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

export default function App() {
  const { session, cargando } = useAuth()

  if (!supabaseConfigurado) return <FaltaConfig />

  if (cargando) {
    return <div className="loader">Cargando…</div>
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
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
