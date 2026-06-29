# Prompt para Claude Code — App completa (todas las fases + login + multidispositivo)

> Copiá todo el texto debajo de la línea y pegalo en Claude Code. Si tenés `Spec_App_Presupuesto_Patrimonio_v2.md` en la carpeta, dejalo ahí como referencia.

---

Quiero que construyas una app web personal de presupuesto y patrimonio, **completa**, con login y accesible desde cualquier dispositivo (celular y PC, mismos datos). Si en la carpeta existe `Spec_App_Presupuesto_Patrimonio_v2.md`, leelo: tiene el detalle de la lógica financiera. Estas instrucciones mandan sobre la spec donde haya diferencias.

Es un proyecto de varios pasos. **Primero mostrame el plan y la estructura del proyecto antes de escribir todo el código**, y avanzá por milestones (ver el orden al final), no todo de una.

## Contexto
App personal de un solo usuario, en Paraguay, moneda guaraní (Gs). Sirve para registrar ingresos (beneficios) y gastos, repartir el margen del negocio entre cuentas bancarias separadas ("sobres"), y avanzar por una ruta de hitos hacia la meta de USD 1.000.000.

## Stack y arquitectura
- **Frontend:** React + Vite, **mobile-first**, limpio y simple. Recharts para gráficos.
- **Backend / datos / autenticación:** Supabase (Postgres + Supabase Auth + Row Level Security). Esto da sincronización multidispositivo y login real.
- **Hosting:** preparar para desplegar en Vercel o Netlify (ambos con HTTPS).
- **Moneda:** mostrar todos los montos con `Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 })` (ej.: `₲ 1.500.000`).

## Autenticación (importante por seguridad)
- Usar **Supabase Auth con email + contraseña**. La contraseña la define el usuario al crear su cuenta; **NO la dejes fija (hardcodeada) en el código**.
- Pantalla de login simple. Mantener la sesión iniciada entre visitas.
- Activar **Row Level Security** en las tablas para que cada usuario solo vea sus datos.
- Las claves/API keys van en variables de entorno (`.env`), nunca en el repo.
- Agregá un `README` con los pasos para: crear el proyecto Supabase, configurar las variables de entorno, crear el usuario y desplegar.

## Modelo de datos (en Supabase)
Tabla `config` (una fila por usuario) y tabla `meses` (una fila por período). Estructura lógica:
```json
config: {
  "modo_ingreso": "margen",            // "margen" | "sueldo"
  "sueldo_fijo": 0,
  "tipo_cambio_usd": 6500,
  "inflacion_anual": 0.04,
  "objetivo_emergencia_meses": 6,
  "regla_excedente": { "ahorro": 0.6, "negocio": 0.4 },
  "meta": { "objetivo_usd": 1000000, "fases_millones_gs": [50,150,300,550,900,1400,2100,3100,4400,6100] },
  "cuentas": [
    { "id": "cuenta_negocio",     "banco": "BNF (METSIM)",      "rol": "negocio",     "porcentaje": null },
    { "id": "cuenta_necesidades", "banco": "Banco Familiar",    "rol": "necesidades", "porcentaje": 0.50 },
    { "id": "cuenta_ahorro",      "banco": "Banco Continental", "rol": "ahorro",      "porcentaje": 0.25 },
    { "id": "cuenta_ocio",        "banco": "Banco-4",           "rol": "ocio",        "porcentaje": 0.25 }
  ]
}
mes: {
  "periodo": "2026-06",
  "ingresos_metsim": 0, "costos_negocio": 0, "pagos_deuda": 0,
  "margen_disponible": 0,
  "distribucion": { "cuenta_necesidades": 0, "cuenta_ahorro": 0, "cuenta_ocio": 0 },
  "remanente_negocio": 0,
  "gasto_real": { "cuenta_necesidades": 0, "cuenta_ocio": 0 },
  "saldos_fin_mes": { "cuenta_negocio": 0, "cuenta_necesidades": 0, "cuenta_ahorro": 0, "cuenta_ocio": 0 }
}
```
Todos los valores de `config` deben ser **editables desde la UI**, nunca fijos en el código.

## Funcionalidades (todas las fases)

**A. Configuración**
Editar bancos y porcentajes (validar que las cuentas personales sumen 100%), tipo de cambio, inflación, modo de ingreso, sueldo fijo, objetivo de fondo de emergencia y las 10 fases de la meta.

**B. Registro mensual (ingresos y gastos)**
- Ingresar: período, ingresos de METSIM, costos del negocio, pagos de deuda → `margen_disponible = ingresos_metsim − costos_negocio − pagos_deuda`.
- **Modo "margen":** distribuir todo el margen → `distribucion[c] = margen_disponible × porcentaje[c]`.
- **Modo "sueldo":** distribuir `sueldo_fijo`; `remanente_negocio = margen_disponible − sueldo_fijo` queda en Banco-1.
- Registrar también el **gasto real** por cuenta (súper, ocio) para comparar contra lo asignado.
- Guardar el mes.

**C. Dashboard**
Saldo total, fase actual con barra hacia la meta, tasa de ahorro del mes (`distribucion.cuenta_ahorro / margen_disponible`), progreso del fondo de emergencia, y torta de distribución del mes. Mostrar montos en Gs con equivalente en USD.

**D. Ruta a USD 1.000.000 (10 fases)**
Mostrar las 10 fases (`fases_millones_gs`), la fase actual y la siguiente, barra de progreso, y el **tiempo estimado a cada fase** según el aporte mensual a ahorro y una tasa de retorno (iterar mes a mes):
```
saldo = saldo_actual; meses = 0
mientras saldo < meta_fase:
    saldo = saldo × (1 + r/12) + aporte_mensual; meses += 1
    si meses > 1200: romper
```
Marcar visualmente cuando se cruza un hito.

**E. Seguimiento real vs. plan + alertas**
Barras de plan vs. gasto real por cuenta. Alertar si una cuenta se pasa (ej.: súper supera un umbral configurable).

**F. Proyector de patrimonio**
Sliders de tasa de retorno y horizonte (años). Curva de patrimonio con valor futuro:
```
r = tasa_anual/12; n = años×12
FV = saldo_inicial×(1+r)^n + aporte_mensual×(((1+r)^n − 1)/r)   // si r=0: aporte×n
```
Comparar escenarios editables (plazo fijo Gs ~5,5% · reinversión negocio 20–30% · USD/global). Mostrar también retorno real descontando inflación: `(1+nominal)/(1+inflacion) − 1`.

**G. Historial y respaldo**
Evolución mensual de saldos y tasa de ahorro en gráficos. Botones de exportar/importar todos los datos como JSON.

## Reglas transversales
- Mobile-first; debe verse y usarse bien en celular.
- Todo configurable desde la UI.
- Manejar bien los casos sin datos (primer uso) sin que rompa.

## Orden de construcción (milestones — pará y mostrame avance en cada uno)
1. Proyecto base + Supabase + login funcionando + modelo de datos.
2. Configuración + Registro mensual (modo margen) + Dashboard.
3. Ruta a USD 1M (10 fases + tiempo estimado).
4. Seguimiento real vs. plan + fondo de emergencia + alertas.
5. Proyector de patrimonio + escenarios.
6. Modo "sueldo" + historial + export/import.
7. Preparar despliegue (Vercel/Netlify) + README con los pasos.

## Verificación final
Probar: login desde dos navegadores distintos viendo los mismos datos, registrar un mes, ver la distribución correcta, avanzar de fase, y que los datos persistan. Confirmar que la contraseña NO está en el código y que RLS está activo.
