import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, MoneyField, TextField, SelectField, DateField, Stat } from '../components/UI'
import { hoyISO, periodoActual } from '../lib/defaults'
import { totalesPeriodo, periodoDe, netoCuentaEnPeriodo } from '../lib/movimientos'
import { formatGs } from '../lib/format'

export default function Movimientos() {
  const {
    config,
    movimientos,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    cargando,
  } = useData()

  const cuentas = config?.cuentas || []
  const cuentaNegocio = cuentas.find((c) => c.rol === 'negocio') || cuentas[0]
  const cuentaAhorro = cuentas.find((c) => c.rol === 'ahorro') || cuentas[0]

  const nuevoForm = () => ({
    fecha: hoyISO(),
    tipo: 'gasto',
    monto: 0,
    categoria: '',
    cuenta_id: cuentaNegocio?.id || '',
    cuenta_destino: cuentaAhorro?.id || '',
    descripcion: '',
  })

  const [form, setForm] = useState(nuevoForm)
  const [editId, setEditId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)
  const [filtroMes, setFiltroMes] = useState(periodoActual())
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [pct, setPct] = useState(25)

  const categorias = useMemo(() => {
    if (!config) return []
    return form.tipo === 'ingreso' ? config.categorias_ingreso : config.categorias_gasto
  }, [config, form.tipo])

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))
  const cuentaNombre = (id) => cuentas.find((c) => c.id === id)?.banco || '—'

  const cambiarTipo = (tipo) => {
    setForm((f) => ({
      ...f,
      tipo,
      cuenta_id: tipo === 'transferencia' ? cuentaNegocio?.id || f.cuenta_id : f.cuenta_id,
      cuenta_destino: cuentaAhorro?.id || f.cuenta_destino,
    }))
  }

  // Base para el calculador de % (ingresos del mes de la fecha elegida).
  const periodoForm = periodoDe(form.fecha)
  const ingresosDelMes = totalesPeriodo(movimientos, periodoForm).ingresos
  const sugeridoPct = Math.round((ingresosDelMes * Number(pct || 0)) / 100)

  const editar = (m) => {
    setEditId(m.id)
    setForm({
      fecha: m.fecha,
      tipo: m.tipo,
      monto: Number(m.monto || 0),
      categoria: m.categoria || '',
      cuenta_id: m.cuenta_id || cuentaNegocio?.id,
      cuenta_destino: m.cuenta_destino || cuentaAhorro?.id,
      descripcion: m.descripcion || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setEditId(null)
    setForm(nuevoForm())
  }

  const onGuardar = async () => {
    if (!form.monto || Number(form.monto) <= 0) return
    if (form.tipo === 'transferencia' && form.cuenta_id === form.cuenta_destino) {
      window.alert('La cuenta de origen y la de destino no pueden ser la misma.')
      return
    }
    setGuardando(true)
    setOk(false)
    try {
      const esTransf = form.tipo === 'transferencia'
      const payload = {
        fecha: form.fecha,
        tipo: form.tipo,
        monto: Number(form.monto),
        categoria: esTransf ? null : form.categoria || categorias[0] || null,
        cuenta_id: form.cuenta_id,
        cuenta_destino: esTransf ? form.cuenta_destino : null,
        descripcion: form.descripcion || (esTransf ? 'Apartado a ahorro' : null),
      }
      if (editId) await actualizarMovimiento(editId, payload)
      else await agregarMovimiento(payload)
      setOk(true)
      setEditId(null)
      setForm(nuevoForm())
      setTimeout(() => setOk(false), 2000)
    } finally {
      setGuardando(false)
    }
  }

  const lista = movimientos.filter((m) => {
    if (filtroMes && periodoDe(m.fecha) !== filtroMes) return false
    if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
    return true
  })

  const tot = totalesPeriodo(movimientos, filtroMes)
  const apartadoAhorro = cuentaAhorro
    ? netoCuentaEnPeriodo(movimientos, cuentaAhorro.id, filtroMes)
    : 0

  const esTransf = form.tipo === 'transferencia'

  return (
    <>
      <Card title={editId ? 'Editar movimiento' : 'Nuevo movimiento'}>
        <div className="btn-row mb">
          <button
            className={'btn ' + (form.tipo === 'gasto' ? 'peligro' : 'secundario')}
            onClick={() => cambiarTipo('gasto')}
            style={form.tipo === 'gasto' ? { background: 'rgba(255,92,122,0.15)' } : {}}
          >
            ➖ Gasto
          </button>
          <button
            className={'btn ' + (form.tipo === 'ingreso' ? '' : 'secundario')}
            onClick={() => cambiarTipo('ingreso')}
            style={form.tipo === 'ingreso' ? { background: 'var(--green)' } : {}}
          >
            ➕ Ingreso
          </button>
          <button
            className={'btn ' + (esTransf ? '' : 'secundario')}
            onClick={() => cambiarTipo('transferencia')}
            style={esTransf ? { background: 'var(--primary)' } : {}}
          >
            ⇄ Ahorrar
          </button>
        </div>

        <DateField label="Fecha" value={form.fecha} onChange={(v) => set('fecha', v)} />

        {esTransf && (
          <div className="card" style={{ background: 'var(--bg-2)', marginBottom: 12 }}>
            <h3>Apartar un % de los ingresos del mes</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div className="field" style={{ margin: 0, width: 90 }}>
                <label>%</label>
                <input
                  inputMode="decimal"
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                />
              </div>
              <button
                className="btn secundario"
                style={{ width: 'auto', flex: 1 }}
                onClick={() => set('monto', sugeridoPct)}
              >
                Usar {formatGs(sugeridoPct)}
              </button>
            </div>
            <div className="hint">
              {pct}% de los ingresos de {periodoForm} ({formatGs(ingresosDelMes)}) ={' '}
              {formatGs(sugeridoPct)}
            </div>
          </div>
        )}

        <MoneyField label="Monto (Gs)" value={form.monto} onChange={(v) => set('monto', v)} />

        {esTransf ? (
          <>
            <SelectField
              label="De cuenta (origen)"
              value={form.cuenta_id}
              onChange={(v) => set('cuenta_id', v)}
              options={cuentas.map((c) => ({ value: c.id, label: `${c.banco} (${c.rol})` }))}
              hint="De dónde sale la plata (ej: BNF METSIM)."
            />
            <SelectField
              label="A cuenta (destino)"
              value={form.cuenta_destino}
              onChange={(v) => set('cuenta_destino', v)}
              options={cuentas.map((c) => ({ value: c.id, label: `${c.banco} (${c.rol})` }))}
              hint="A dónde va (ej: Banco Continental / ahorro)."
            />
          </>
        ) : (
          <>
            <SelectField
              label="Categoría"
              value={form.categoria || categorias[0]}
              onChange={(v) => set('categoria', v)}
              options={categorias}
            />
            <SelectField
              label="Cuenta"
              value={form.cuenta_id}
              onChange={(v) => set('cuenta_id', v)}
              options={cuentas.map((c) => ({ value: c.id, label: `${c.banco} (${c.rol})` }))}
            />
          </>
        )}

        <TextField
          label="Descripción (opcional)"
          value={form.descripcion}
          onChange={(v) => set('descripcion', v)}
          placeholder={esTransf ? 'Ej: ahorro del mes' : 'Ej: compra del súper'}
        />

        {ok && <div className="ok-box mb">Movimiento guardado ✓</div>}
        <div className="btn-row">
          <button className="btn" onClick={onGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar movimiento'}
          </button>
          {editId && (
            <button className="btn secundario" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </div>
      </Card>

      <div className="grid3 mb">
        <Stat label="Ingresos del mes" valueGs={tot.ingresos} small />
        <Stat label="Gastos del mes" valueGs={tot.gastos} small />
        <Stat label="Apartado a ahorro" valueGs={apartadoAhorro} small />
      </div>

      <Card title="Movimientos">
        <div className="grid2 mb">
          <div className="field" style={{ margin: 0 }}>
            <label>Mes</label>
            <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
              <option value="transferencia">Transferencias</option>
            </select>
          </div>
        </div>

        {lista.length === 0 ? (
          <p className="muted center">No hay movimientos en este filtro.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Detalle</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => {
                const transf = m.tipo === 'transferencia'
                const color = transf
                  ? 'var(--primary)'
                  : m.tipo === 'ingreso'
                    ? 'var(--green)'
                    : 'var(--red)'
                const signo = transf ? '⇄ ' : m.tipo === 'ingreso' ? '+' : '−'
                return (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{m.fecha?.slice(5)}</td>
                    <td>
                      <div>{transf ? 'Transferencia' : m.categoria}</div>
                      <div className="muted" style={{ fontSize: '0.72rem' }}>
                        {transf
                          ? `${cuentaNombre(m.cuenta_id)} → ${cuentaNombre(m.cuenta_destino)}`
                          : cuentaNombre(m.cuenta_id)}
                        {m.descripcion ? ` · ${m.descripcion}` : ''}
                      </div>
                    </td>
                    <td style={{ color, whiteSpace: 'nowrap' }}>
                      {signo}
                      {formatGs(m.monto)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn secundario"
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={() => editar(m)}
                      >
                        ✏️
                      </button>{' '}
                      <button
                        className="btn peligro"
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={() => {
                          if (window.confirm('¿Borrar este movimiento?')) eliminarMovimiento(m.id)
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
