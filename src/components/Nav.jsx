import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', ic: '📊', label: 'Inicio', end: true },
  { to: '/registro', ic: '✍️', label: 'Registro' },
  { to: '/ruta', ic: '🎯', label: 'Ruta 1M' },
  { to: '/seguimiento', ic: '📈', label: 'Real/Plan' },
  { to: '/proyector', ic: '🔮', label: 'Proyector' },
  { to: '/historial', ic: '🗂️', label: 'Historial' },
  { to: '/config', ic: '⚙️', label: 'Ajustes' },
]

export default function Nav() {
  return (
    <nav className="nav">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => (isActive ? 'activo' : '')}
        >
          <span className="ic">{it.ic}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
