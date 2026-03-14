# Transfer Checklist

Checklist para cerrar la venta sin dejar cabos sueltos.

## Antes de aceptar oferta

- Confirmar que el alcance vendido es `repo + dominio + despliegue` y no una transferencia completa de todas las cuentas.
- Regenerar `docs/sale/readiness-report.md` con `npm run sale:check`.
- Subir a `docs/sale/evidence/` las pruebas de trafico, dominio y costes.
- Ajustar el listing con el tramo de precio correcto segun trafico y estado del API.
- Dejar por escrito si `api.ttseasy.com` llega live o se entrega como stack redeployable.

## Elementos incluidos en la entrega base

- Repositorio completo
- Dominio `ttseasy.com`
- Configuracion de despliegue en Vercel para variante `public` y `api`
- Mapa de variables de entorno basado en `.env.example` y `docs/deploy-vercel.md`
- Documentacion de arquitectura, troubleshooting y deploy
- Dos semanas de handoff asincrono

## Cuentas y accesos

Define explicitamente que opcion aplica:

### Opcion A: transferencia minima

- Transferir dominio
- Transferir codigo
- Transferir proyectos Vercel si interesa al comprador
- Recrear Stripe, Supabase, Upstash y Google Cloud bajo la cuenta del comprador

### Opcion B: transferencia operativa ampliada

- Transferir dominio
- Transferir codigo
- Transferir proyectos Vercel
- Transferir o migrar Supabase
- Transferir configuracion Stripe compatible con el comprador
- Reconfigurar Google Cloud, Upstash y secretos con credenciales del comprador

## Dia de cierre

- Cambiar titularidad o acceso del registrador del dominio
- Confirmar DNS apuntando a la infraestructura acordada
- Transferir acceso al repositorio o entregar bundle privado si la venta no incluye la cuenta Git
- Compartir este paquete documental:
  - `docs/deploy-vercel.md`
  - `docs/troubleshooting.md`
  - `docs/sale/api-redeploy-runbook.md`
  - `docs/sale/readiness-report.md`
- Entregar listado de secretos requeridos sin incluir secretos antiguos del vendedor

## Handoff de 2 semanas

- Resolver dudas sobre deploy, billing y content inventory
- Asistir en redeploy del API si fuera necesario
- Validar que:
  - `www.ttseasy.com/en` responde `200`
  - `api.ttseasy.com` o el host acordado responde `200`
  - `/pricing`, `/docs` y `/api/health` funcionan

## Cierre tecnico final

- Revocar accesos del vendedor a servicios transferidos
- Rotar claves y secretos del comprador
- Confirmar que analytics y facturacion quedan bajo control del comprador
- Archivar el paquete de venta y los comprobantes de transferencia
