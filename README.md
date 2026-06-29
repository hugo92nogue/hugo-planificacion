# Presupuesto & Patrimonio 💰

App web personal (mobile-first) para registrar ingresos y gastos, repartir el margen del negocio entre cuentas ("sobres"), seguir tu **ruta de 10 fases hacia USD 1.000.000** y proyectar tu patrimonio. Con **login real** y **sincronización entre dispositivos** (celular y PC ven los mismos datos) gracias a Supabase.

- **Frontend:** React + Vite + Recharts (mobile-first)
- **Backend / datos / login:** Supabase (Postgres + Auth + Row Level Security)
- **Moneda:** Guaraní (Gs) con equivalente en USD
- **Hosting:** listo para Vercel o Netlify (HTTPS)

---

## 1) Requisitos

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).
- Una cuenta gratis en [supabase.com](https://supabase.com).

## 2) Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) → **New project**. Elegí un nombre y una contraseña de base de datos (guardala).
2. Cuando esté listo, andá a **SQL Editor → New query**, pegá **todo** el contenido de [`supabase_schema.sql`](./supabase_schema.sql) y tocá **Run**. Esto crea las tablas `config` y `meses` y **activa Row Level Security** (cada usuario solo ve sus datos).
   - Después abrí **otra** query y corré también [`supabase_schema_v2.sql`](./supabase_schema_v2.sql): agrega las tablas `movimientos` (registro de cada ingreso/gasto) e `instrumentos` (inversiones), con su RLS. Es necesario para el registro por transacción, los reportes y las inversiones.
   - Por último corré [`supabase_schema_v3.sql`](./supabase_schema_v3.sql): habilita las **transferencias entre cuentas** (ej.: apartar un % de tu ingreso a la cuenta de ahorro). Es idempotente; si arrancás de cero, con correr **solo v3** ya quedan todas las tablas creadas.
3. Andá a **Settings → API** y copiá:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **anon public key** → será `VITE_SUPABASE_ANON_KEY`

> **Confirmación de email:** por defecto Supabase puede pedir confirmar el email al registrarse. Para uso personal podés desactivarlo en **Authentication → Providers → Email → "Confirm email" = off**, así entrás enseguida. (Opcional.)

## 3) Configurar las variables de entorno

En la carpeta del proyecto, copiá el archivo de ejemplo y completalo con tus claves:

```bash
copy .env.example .env      # Windows (PowerShell/CMD)
# o en Mac/Linux:  cp .env.example .env
```

Editá `.env`:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_PUBLIC_KEY
```

> 🔒 El archivo `.env` **no se sube al repo** (está en `.gitignore`). Las claves nunca van en el código. La contraseña de tu usuario la definís vos al crear la cuenta, **no está hardcodeada**.

## 4) Instalar y correr en local

```bash
npm install
npm run dev
```

Abrí la URL que muestra (normalmente `http://localhost:5173`).

**Crear tu cuenta:** en la pantalla de login tocá **"No tengo cuenta — crear una"**, poné tu email y una contraseña (mínimo 6 caracteres). La primera vez la app crea automáticamente tu configuración por defecto, que después podés editar entera desde **Ajustes**.

**Probar desde el celular (misma red WiFi):** Vite ya está configurado con `host: true`. Mirá la IP que aparece como *Network* (ej. `http://192.168.0.10:5173`) y abrila en el celu.

---

## 5) Cómo se usa

- **Inicio (Dashboard):** patrimonio total, fase actual y barra hacia la meta, tasa de ahorro del mes, fondo de emergencia y torta de distribución.
- **Registro:** cargás período, ingresos de METSIM, costos y pagos de deuda. La app calcula el margen y la distribución. Cargás también el gasto real y los saldos de fin de mes (hay botón "Usar sugeridos").
- **Ruta 1M:** las 10 fases + la meta en USD, con el tiempo estimado a cada hito según tu aporte mensual y la tasa.
- **Real/Plan:** barras de lo asignado vs. lo gastado, con alerta si te pasás del umbral.
- **Proyector:** sliders de tasa y horizonte; compara escenarios (plazo fijo Gs, reinversión negocio, USD) y muestra el retorno real descontando inflación.
- **Historial:** evolución del patrimonio y de la tasa de ahorro + **exportar/importar** todo como JSON.
- **Ajustes:** todo es editable (bancos, porcentajes —validados a 100%—, tipo de cambio, inflación, modo de ingreso, sueldo fijo, fondo de emergencia, umbral de alerta y las 10 fases).

### Modos de ingreso
- **Margen:** se reparte **todo** el margen del mes según los porcentajes de cada cuenta.
- **Sueldo:** te asignás un **sueldo fijo** (se reparte según porcentajes) y el resto queda como **remanente en la cuenta del negocio**.

---

## 6) Desplegar (para usarlo desde cualquier lado, siempre con HTTPS)

### Opción A — Vercel
1. Subí el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo.
3. Framework: **Vite** (lo detecta solo). Build: `npm run build`, Output: `dist` (ya está en `vercel.json`).
4. En **Settings → Environment Variables** agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. **Deploy.** Te queda una URL HTTPS para entrar desde el celular o la PC.

### Opción B — Netlify
1. Subí el proyecto a GitHub.
2. En [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
3. Build command `npm run build`, Publish directory `dist` (ya está en `netlify.toml`).
4. En **Site settings → Environment variables** agregá las dos variables `VITE_...`.
5. **Deploy.**

> Después de desplegar, agregá la URL de tu sitio en Supabase → **Authentication → URL Configuration → Site URL / Redirect URLs**, para que el login funcione sin problemas.

---

## 7) Seguridad (checklist)

- ✅ La contraseña la define el usuario al registrarse; **no está en el código**.
- ✅ Las claves van en `.env` (ignorado por git), nunca en el repo.
- ✅ **Row Level Security activo** en `config` y `meses`: cada usuario solo ve sus filas (`auth.uid() = user_id`).
- ✅ Sesión persistente entre visitas.

## 8) Verificación final

1. Iniciá sesión desde **dos navegadores distintos** (o PC + celular): deberías ver los **mismos datos**.
2. Registrá un mes y verificá que la **distribución** sea correcta.
3. Avanzá de **fase** al subir el patrimonio.
4. Recargá la página: los datos **persisten**.
5. Confirmá en Supabase que **RLS** está activo (las tablas muestran el candado en **Table Editor**).

---

## Estructura del proyecto

```
src/
├── lib/        supabase.js · format.js (Gs/USD) · finance.js (lógica) · defaults.js
├── context/    AuthContext.jsx (login) · DataContext.jsx (config + meses)
├── components/ Layout.jsx · Nav.jsx · UI.jsx
└── pages/      Login · Dashboard · Registro · Ruta · Seguimiento · Proyector · Historial · Configuracion
```
