import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()
  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>Presupuesto &amp; Patrimonio</h1>
          <div className="sub">{user?.email}</div>
        </div>
        <button className="btn secundario" style={{ width: 'auto' }} onClick={signOut}>
          Salir
        </button>
      </div>
      <Outlet />
      <Nav />
    </div>
  )
}
