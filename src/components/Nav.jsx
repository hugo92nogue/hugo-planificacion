import { NavLink } from 'react-router-dom'

// Navegación principal (mobile-first). El resto de herramientas (ruta a 1M,
// sobres, proyector, historial, ajustes) viven en la página "Más".
const items = [
  { to: '/', ic: '📊', label: 'Inicio', end: true },
  { to: '/movimientos', ic: '✍️', label: 'Movim.' },
  { to: '/inversiones', ic: '💎', label: 'Inversión' },
  { to: '/reportes', ic: '📈', label: 'Reportes' },
  { to: '/mas', ic: '⋯', label: 'Más' },
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
