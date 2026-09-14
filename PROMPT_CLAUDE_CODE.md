# PROMPT PARA CLAUDE CODE — copia y pega todo lo que sigue

Construye ECOEMS Quest, una app web de preparación para el examen ECOEMS,
completa: frontend y backend juntos en un solo proyecto.

Este proyecto YA tiene un repositorio en GitHub llamado "ecoquest". Antes de
generar código, conecta esta carpeta a ese repositorio (ver README.md, sección
"Conectar con GitHub") en vez de crear uno nuevo.

FUENTES (en esta carpeta):
- ECOEMS_Quest_Spec_Final.md → funcionalidad base: flujos, reglas, precios,
  límites de TutorIA, esquema del banco de preguntas y navegación.
- ECOEMS_Quest_Diagrama_Flujo_v1.2.docx → agrega dos partes: (1) sección
  "Competir": Battle Royale (estilo Kahoot, salas de 20-50 jugadores en
  vivo), Arena PvP (duelos 1v1 asíncronos con trofeos y ligas), Clanes
  (grupos de estudio persistentes con código de invitación) y Marcador
  Global (ranking de todos los usuarios); (2) sección "Rachas de estudio":
  contador de días consecutivos, congelados ganados (nunca comprados) y
  modo vacaciones — diseño deliberadamente sin mecánicas de culpa ni de
  pago, por ser usuarios menores de edad. Incluye las reglas exactas y las
  notas de protección de menores (sin nombres reales, sin chat libre).
- demo/ECOEMS_Quest_Demo_v4.2.html → referencia visual y de experiencia de
  TODO lo anterior, incluida Competir y Rachas. Replica su paleta (gris
  oscuro principal, naranja secundario, azul oscuro terciario), tipografía
  (Baloo 2), componentes y modo claro/oscuro. NO copies su código ni su
  lógica: los bots, el tiempo real y el avance de días están simulados ahí
  solo para probar la experiencia; en la app real Battle Royale y Arena
  necesitan infraestructura real (ver más abajo), y las rachas se calculan
  por fecha de calendario real, no por un botón de "avanzar día".

STACK:
- Next.js 14+ (App Router) con TypeScript: frontend y backend (API routes)
  en el mismo proyecto.
- Supabase: autenticación (correo con verificación + Google OAuth), base de
  datos Postgres, y Supabase Realtime para las salas de Battle Royale y los
  duelos de Arena.
- Stripe: suscripciones ($149/mes, $549/6 meses, $949/año) y monedero de
  recargas de TutorIA.
- API de Anthropic (modelo Haiku) para TutorIA, siempre a través de un
  endpoint propio en el backend.
- Tailwind CSS para estilos, con variables de tema para claro/oscuro.

REGLAS DE SEGURIDAD INNEGOCIABLES:
1. Las respuestas correctas de los reactivos NUNCA llegan al frontend: el
   cliente manda la respuesta elegida y el backend califica.
2. La validación de suscripción activa y de mensajes disponibles de TutorIA
   se hace en el backend en cada petición.
3. Ninguna API key en el código: todas en .env.local (dame un .env.example
   con la lista de variables que necesito llenar).
4. Webhooks de Stripe para activar/expirar suscripciones; nunca confiar en
   el cliente para el estado de pago.
5. En Competir: nunca se expone nombre real ni foto de perfil, solo apodo;
   no existe chat de texto libre entre usuarios en ninguna dinámica.

PLAN DE TRABAJO GENERAL (para que tengas el mapa completo):
Etapa 1: estructura del proyecto + esquema de base de datos (incluye ya las
  tablas de trofeos/liga, clanes, salas de Battle Royale y marcador global,
  aunque su lógica se construya después) + seed con un banco demo de
  reactivos (esquema JSON de la spec, sección 8).
Etapa 2: autenticación completa y paywall (con Stripe en modo prueba).
Etapa 3: página de inicio, diagnóstico, Mundos, Materias y Examen con
  calificación en backend, estrellas, progreso y botón Repasar.
Etapa 4: TutorIA con límites, contador y recargas según la spec (sección 7).
Etapa 5: Marcador Global (sin tiempo real) y Clanes.
Etapa 6: Arena PvP (tiempo real ligero, asíncrono).
Etapa 7: Battle Royale (tiempo real completo, salas en vivo).
Etapa 8: perfil completo, modo bloqueado por expiración, manejo de errores
  y estados de carga, y configuración lista para desplegar en Vercel.

POR AHORA HAZ SOLO LA ETAPA 1 Y DETENTE:
- Conecta el proyecto al repositorio GitHub "ecoquest" existente.
- Crea el proyecto Next.js con TypeScript y Tailwind, con la estructura de
  carpetas para todo el plan.
- Define el esquema completo de la base de datos como migraciones SQL para
  Supabase, incluyendo ya las tablas nuevas: trofeos_liga, clanes,
  clan_miembros, salas_battle_royale, duelos_arena, marcador_global y
  rachas_estudio (días actuales, mejor racha, congelados disponibles,
  modo vacaciones y fecha de última actividad — calculado por un proceso
  diario a medianoche en la zona horaria del usuario, nunca en tiempo real).
- Crea el script de seed que carga reactivos desde archivos JSON con el
  esquema de la sección 8 de la spec, validando ids únicos y que la
  respuesta correcta exista en las opciones, con un banco demo de ejemplo.
- Deja el proyecto corriendo en local con una página temporal que confirme
  que la base de datos conecta y muestre cuántos reactivos hay por materia.
- Documenta en un README qué hiciste, cómo lo corro, y qué necesitaré
  configurar en las siguientes etapas.

Mientras yo no tenga las llaves reales, deja todo funcionando en modo local
con datos de prueba. Cuando termines la etapa 1, muéstrame un resumen de lo
construido y espera mi confirmación antes de continuar con la etapa 2.
