import { formatGs, formatUsd, gsToUsd, parseNumero } from '../lib/format'

// Tarjeta contenedora
export function Card({ title, children, right }) {
  return (
    <div className="card">
      {(title || right) && (
        <div className="row-between" style={{ marginBottom: title ? 10 : 0 }}>
          {title ? <h2 style={{ margin: 0 }}>{title}</h2> : <span />}
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

// Bloque de estadística (Gs + equivalente en USD opcional)
export function Stat({ label, valueGs, value, tipoCambio, small }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className={'value' + (small ? ' small' : '')}>
        {value != null ? value : formatGs(valueGs)}
      </div>
      {tipoCambio && value == null && (
        <div className="usd">≈ {formatUsd(gsToUsd(valueGs, tipoCambio))}</div>
      )}
    </div>
  )
}

// Barra de progreso (fracción 0..1)
export function Progress({ fraccion }) {
  const pct = Math.max(0, Math.min(1, Number(fraccion || 0))) * 100
  return (
    <div className="progress">
      <span style={{ width: pct + '%' }} />
    </div>
  )
}

// Campo numérico que muestra con separador de miles y guarda número.
export function MoneyField({ label, value, onChange, hint }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input
        inputMode="numeric"
        value={value === 0 || value ? Number(value).toLocaleString('es-PY') : ''}
        onChange={(e) => onChange(parseNumero(e.target.value))}
        placeholder="0"
      />
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

// Campo de porcentaje (se guarda como fracción 0..1, se muestra como 0..100)
export function PercentField({ label, value, onChange, hint }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input
        inputMode="decimal"
        value={value === 0 || value ? (Number(value) * 100).toString() : ''}
        onChange={(e) => {
          const n = parseNumero(e.target.value)
          onChange(n / 100)
        }}
        placeholder="0"
      />
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export function TextField({ label, value, onChange, hint, type = 'text', placeholder }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export function SelectField({ label, value, onChange, options = [], hint }) {
  // options: array de strings o de { value, label }
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return (
            <option key={v} value={v}>
              {l}
            </option>
          )
        })}
      </select>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export function DateField({ label, value, onChange, hint }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}
