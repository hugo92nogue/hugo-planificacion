import { Outlet } from 'react-router-dom'
import Nav from './Nav'

export default function Layout() {
  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>Presupuesto &amp; Patrimonio</h1>
          <div className="sub">Tus finanzas, en un solo lugar</div>
        </div>
      </div>
      <Outlet />
      <Nav />
    </div>
  )
}
