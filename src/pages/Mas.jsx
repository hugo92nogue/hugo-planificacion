import { Link } from 'react-router-dom'
import { Card } from '../components/UI'

const opciones = [
  { to: '/ruta', ic: '🎯', titulo: 'Ruta a USD 1.000.000', desc: '10 fases y tiempo estimado a cada hito.' },
  { to: '/proyector', ic: '🔮', titulo: 'Proyector de patrimonio', desc: 'Simulá escenarios de retorno a futuro.' },
  { to: '/registro', ic: '📦', titulo: 'Plan mensual (sobres)', desc: 'Repartí el margen del negocio entre cuentas.' },
  { to: '/seguimiento', ic: '⚖️', titulo: 'Real vs. plan', desc: 'Compará lo asignado con lo que gastaste.' },
  { to: '/historial', ic: '🗂️', titulo: 'Historial y respaldo', desc: 'Evolución mensual + exportar/importar JSON.' },
  { to: '/config', ic: '⚙️', titulo: 'Ajustes', desc: 'Cuentas, categorías, tipo de cambio, fases y más.' },
]

export default function Mas() {
  return (
    <Card title="Más herramientas">
      {opciones.map((o) => (
        <Link
          key={o.to}
          to={o.to}
          className="card"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            background: 'var(--bg-2)',
            marginBottom: 10,
            color: 'var(--text)',
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>{o.ic}</span>
          <span>
            <div style={{ fontWeight: 600 }}>{o.titulo}</div>
            <div className="muted" style={{ fontSize: '0.78rem' }}>
              {o.desc}
            </div>
          </span>
        </Link>
      ))}
    </Card>
  )
}
