# ECOEMS QUEST — Especificación funcional v1.0 (lista para desarrollo)

App web de preparación para el examen ECOEMS "Mi Derecho, Mi Lugar" (ingreso a educación media superior, antes COMIPEMS). Modelo de suscripción de pago. Stack sugerido: **Next.js + Supabase (auth + Postgres) + Stripe**. El tutor con IA (TutorIA) usa la **API de Anthropic (modelo económico: claude-haiku)** con límites de uso y recargas.

---

## 0. Datos maestros del examen (fuente de verdad)

El examen real ECOEMS: **128 reactivos, opción múltiple A/B/C/D, una sola correcta, 3 horas.**

Distribución oficial por materia (10 materias):

| # | Materia | Reactivos en examen | Tipo |
|---|---------|--------------------|------|
| 1 | Español | 12 | Conocimiento |
| 2 | Habilidad Verbal | 16 | Habilidad |
| 3 | Matemáticas | 12 | Conocimiento |
| 4 | Habilidad Matemática | 16 | Habilidad |
| 5 | Biología | 12 | Conocimiento |
| 6 | Física | 12 | Conocimiento |
| 7 | Química | 12 | Conocimiento |
| 8 | Historia | 12 | Conocimiento |
| 9 | Geografía | 12 | Conocimiento |
| 10 | Formación Cívica y Ética | 12 | Conocimiento |

**Total: 128.** Esta tabla gobierna: el simulador, el diagnóstico, los mundos y la distribución del banco de preguntas.

---

## 1. Autenticación

### 1.1 Portada (pantalla inicial)
Dos acciones: **[Iniciar sesión]** y **[Crear cuenta]**.

### 1.2 Iniciar sesión
- Campos: correo + contraseña. Botones: [Entrar], [← Volver a portada], enlace **"¿Olvidaste tu contraseña?"**.
- Si credenciales válidas **y suscripción activa** → Página de inicio.
- Si credenciales válidas **y suscripción vencida/inexistente** → Pantalla de pago (ver §2).
- Si credenciales inválidas → mensaje "Correo o contraseña incorrectos", permanece en la pantalla. Tras 5 intentos fallidos, bloqueo temporal de 10 minutos (mostrar contador).
- **Recuperar contraseña:** pide correo → envía link de restablecimiento (token de 1 hora) → formulario de nueva contraseña → confirmación → regresa a Iniciar sesión.

### 1.3 Crear cuenta
Dos rutas, **ambas terminan en el sistema de pagos** (corregido: Google NO se salta el pago):

**A) Con Google (OAuth):**
1. Redirige a Google → si autoriza, se crea la cuenta (correo ya verificado por Google).
2. Si falla/cancela → regresa a Crear cuenta con mensaje de error y opción de reintentar o usar correo.
3. Cuenta creada → **Sistema de pagos (§2)**.

**B) Con correo:**
1. Campos: correo, contraseña, confirmar contraseña. Validación: correo con formato válido y no registrado; contraseña mínimo 8 caracteres. Botón [← Volver].
2. Al crear → enviar correo de verificación (código de 6 dígitos o link, expira en 24 h). Pantalla "Revisa tu correo" con botón [Reenviar código] (cooldown 60 s) y [Cambiar correo].
3. Correo verificado = true → **Sistema de pagos (§2)**.
4. Correo verificado = false / código incorrecto → mensaje de error, repetir hasta true (o abandonar; la cuenta queda en estado "pendiente de verificación" y al volver a iniciar sesión se le pide verificar).

En todas las pantallas de auth: botón/flecha **← Regresar** al paso anterior y enlace a portada.

---

## 2. Sistema de pagos (Stripe)

Planes (todos corren desde el día de compra, sin fecha fija de corte):

| Plan | Precio |
|------|--------|
| 1 mes | $149 MXN |
| 6 meses | $549 MXN |
| 1 año | **$949 MXN** |

- Pantalla con los 3 planes, botón [Elegir] en cada uno, botón [Cerrar sesión] (para poder salir sin pagar).
- Pago exitoso → activar suscripción por el periodo elegido → **Página de inicio**.
- Pago fallido → mensaje de error de Stripe, permanecer en pantalla, permitir reintentar u otro método.
- **Expiración:** al vencer, el usuario entra en "modo bloqueado": solo puede ver su Perfil (progreso e historial en solo lectura) y la pantalla de renovación. Mundos, Materias, Examen y TutorIA quedan bloqueados con candado y CTA "Renovar suscripción". El progreso NUNCA se borra.
- Recordatorio de vencimiento: banner en la app y correo 3 días antes.
- El monedero/saldo de TutorIA (ver §7) es independiente de la suscripción: el saldo no caduca, pero solo se puede usar con suscripción activa.

---

## 3. Página de inicio

Layout con **4 tarjetas grandes** en este orden:
1. 🌍 **Mundos de preguntas**
2. 📚 **Materias** (ejercicios tipo examen)
3. 📝 **Examen** (simulador completo)
4. 🤖 **TutorIA**

Elementos permanentes en toda la app (excepto dentro de un examen en curso):
- **Barra superior:** logo (click → inicio), nombre del usuario, acceso a Perfil.
- **Menú de opciones** (hamburguesa o barra): Inicio · Mundos · Materias · Examen · TutorIA · Perfil · Cerrar sesión.
- Todas las pantallas internas tienen **← Regresar** (a la pantalla anterior) y **🏠 Inicio**.

### 3.1 Examen diagnóstico (solo primera vez)
- Al primer ingreso tras el pago, modal: "Antes de empezar, haz tu examen diagnóstico" con [Comenzar] y [Omitir por ahora] (si omite, la tarjeta del diagnóstico queda visible en inicio hasta que lo haga; se puede hacer una sola vez).
- Contenido: **5 preguntas por materia × 10 materias = 50 preguntas**, dificultad progresiva dentro de cada materia. **Tiempo máximo total: 1 hora** (cronómetro visible).
- Al terminar: puntaje global, desglose por materia, clasificación de materias en Fuerte / Regular / Débil.
- Los resultados se guardan y se envían como contexto inicial a TutorIA.
- Navegación interna: [Siguiente], [Anterior], mapa de preguntas para saltar, [Terminar y calificar] con confirmación. Botón [Salir] con advertencia: "Si sales, se calificará con lo que llevas" / opción cancelar.

---

## 4. Mundos de preguntas (ruta de aprendizaje gamificada)

- **Un mundo por materia (10 mundos).** Cada mundo es una ruta de niveles; **un nivel = un tema del temario** de esa materia.
- Cada nivel tiene **mínimo 10 preguntas** (tomadas del banco por subtemario, con combinatoria para variar en cada intento).
- **Desbloqueo secuencial:** el nivel N+1 se desbloquea al aprobar el nivel N con **≥ 6/10 aciertos**. El primer nivel de cada mundo siempre está abierto.
- **Estrellas por nivel (máx 5), según aciertos del mejor intento:**
  - 10/10 → ★★★★★
  - 9/10 → ★★★★
  - 8/10 → ★★★
  - 7/10 → ★★
  - 6/10 → ★ (aprobado)
  - ≤5/10 → sin estrella, nivel no aprobado, [Reintentar].
- Los niveles se pueden **repetir las veces que sea**; siempre se conserva la mejor puntuación.
- **Porcentaje del mundo** visible en el mapa y en la tarjeta del mundo: % = niveles aprobados / niveles totales. Mostrar también estrellas acumuladas / estrellas posibles.
- Dentro de un nivel: pregunta con opciones A–D, feedback inmediato al responder (correcto/incorrecto + explicación breve del campo `feedback` del reactivo), botón **[Repasar]** (ver §5, mismo comportamiento), [Siguiente]. Botón [Salir del nivel] con confirmación (el intento no cuenta si sale antes de terminar).
- Al terminar el nivel: pantalla de resultado con aciertos, estrellas obtenidas, [Reintentar] [Siguiente nivel] [Volver al mapa].

---

## 5. Materias (ejercicios tipo examen)

- El usuario elige una de las 10 materias.
- Cada ejercicio: **20 preguntas tipo examen** (estructura idéntica al examen real: enunciado + opciones A, B, C, D, una correcta).
- **Combinatoria:** en cada intento se arma un set de 20 preguntas distinto, seleccionado aleatoriamente del banco de esa materia, evitando repetir preguntas usadas en los últimos 2 intentos del usuario en esa materia (si el banco no alcanza, se permite repetir las más antiguas).
- **Tiempo:** 15 minutos por ejercicio; **20 minutos para Habilidad Matemática y Habilidad Verbal.** Cronómetro visible; al agotarse, se califica automáticamente con lo respondido.
- **Botón [Repasar] en cada pregunta:** guarda la pregunta (id + materia + subtemario) en la lista de repaso del usuario. TutorIA la usará después para explicarle el tema. La pregunta marcada muestra un indicador 🔖.
- Al final: **puntaje x/20**, lista de correctas e incorrectas con la respuesta correcta y su `feedback`, y botón [Enviar mis pendientes a TutorIA].
- Español / comprensión lectora: los reactivos de lectura usan **textos originales escritos ex profeso al estilo del examen** (150–300 palabras, narrativos/expositivos/argumentativos), precargados en el banco con sus preguntas asociadas (campo `texto_lectura`). No se copian textos de guías oficiales ni se buscan en la red (derechos de autor + la app no tiene búsqueda en runtime).
- Navegación igual que en diagnóstico: Siguiente/Anterior, mapa de preguntas, [Terminar] con confirmación, [Salir] con advertencia.

---

## 6. Examen (simulador completo)

- **128 preguntas con la distribución oficial de la tabla §0**, armadas por combinatoria del banco (por materia y respetando su cuota exacta de reactivos).
- **Tiempo máximo: 3 horas**, cronómetro siempre visible. Al agotarse, se califica automáticamente.
- Orden de secciones igual al examen real (por bloques de materia). Mapa de preguntas para navegar/saltar; preguntas sin responder marcadas.
- **[Pausar]** NO existe (fidelidad al examen real). [Salir] con doble confirmación: "Perderás este intento".
- Al terminar:
  - Puntaje global (aciertos/128).
  - Desglose por materia (aciertos/reactivos de esa materia).
  - Lista de correctas e incorrectas, con respuesta correcta y feedback.
  - Clasificación **Fuerte / Regular / Débil** por materia (Fuerte ≥80%, Regular 50–79%, Débil <50%).
  - Botón [Enviar resultados a TutorIA] (envía el desglose y las materias débiles).
- Historial de simulacros en Perfil (fecha, puntaje, desglose) con gráfica de evolución.

---

## 7. TutorIA (tutor con IA — API de Anthropic)

### 7.1 Función
Chat de tutoría que:
- Responde dudas académicas de las 10 materias del ECOEMS.
- Recibe automáticamente como contexto: resultados del diagnóstico, materias débiles de los simulacros, y la **lista de preguntas guardadas con [Repasar]** (puede explicarlas una por una: "Explícame mi pregunta guardada de Química").
- Da planes de repaso y explica temas paso a paso, adaptado a nivel secundaria.

### 7.2 Implementación
- Backend propio como proxy: el cliente NUNCA ve la API key. Endpoint `/api/tutoria` → llama a la API de Anthropic.
- Modelo: **claude-haiku** (el más económico vigente), `max_tokens` de salida: 1,000 por respuesta.
- System prompt fijo: tutor pedagógico para secundaria/ECOEMS; solo temas del examen; si preguntan algo fuera de tema, redirigir amablemente al estudio; nunca dar respuestas de exámenes en curso; lenguaje claro para adolescentes; responder en español.
- Contexto por conversación: historial recortado a los últimos ~10 mensajes + resumen del perfil académico del usuario (materias débiles, preguntas en repaso).

### 7.3 Límites y recargas (control de costos)
- **Incluido con la suscripción: 100 mensajes de TutorIA por mes** (se reinicia cada 30 días desde la fecha de compra/renovación; los no usados NO se acumulan).
- Contador visible en la pantalla de TutorIA: "Te quedan 37/100 mensajes este mes".
- Al llegar a 0: el chat se bloquea con mensaje "Se acabaron tus mensajes del mes" + botón **[Recargar]**.
- **Recargas (monedero):** el usuario abona saldo a su monedero (montos: $20 / $50 / $100 MXN vía Stripe) y desde el saldo compra paquetes de **$9 MXN = 30 mensajes extra**. Los mensajes extra no caducan mientras la suscripción esté activa.
- Límites anti-abuso: máx. 30 mensajes por hora; mensaje del usuario máx. 1,500 caracteres.
- Si la API de Anthropic falla: mensaje "TutorIA no está disponible, intenta en unos minutos" y NO se descuenta el mensaje.

---

## 8. Banco de preguntas

### 8.1 Esquema de cada reactivo (JSON)
```json
{
  "id_reactivo": "QUI-034",
  "asignatura": "Química",
  "subtemario": "Tabla periódica",
  "dificultad": 1,
  "texto_lectura": null,
  "enunciado": "…",
  "opciones": { "A": "…", "B": "…", "C": "…", "D": "…" },
  "respuesta_correcta": "B",
  "feedback": "Explicación breve de por qué B es correcta."
}
```
- `dificultad`: 1 fácil, 2 media, 3 difícil (usada por el diagnóstico para su progresión y por los mundos para ordenar niveles).
- `texto_lectura`: solo en reactivos de comprensión lectora (Español / Hab. Verbal); varios reactivos pueden compartir el mismo texto vía un `id_texto`.
- Carga por lotes: script (Node.js) que lee archivos JSON con este esquema y los inserta en la base de datos, validando ids únicos y que `respuesta_correcta` exista en `opciones`.

### 8.2 Tamaño del banco
- **Meta: 150 reactivos por materia (1,500 total).**
- **Mínimo de lanzamiento: 60 reactivos por materia (600 total)** — permite 3 ejercicios de Materias sin repetir y simulacros con variedad aceptable. El banco actual (~250 reactivos) se completa hasta el mínimo antes del lanzamiento y se sigue creciendo hasta la meta después de lanzar.
- Cada materia debe cubrir todos sus subtemarios (para que los mundos tengan niveles completos) y las tres dificultades.

---

## 9. Perfil del usuario

Secciones:
- **Progreso:** % por mundo, estrellas totales, historial de ejercicios de Materias (fecha, materia, x/20), historial de simulacros con gráfica de evolución del puntaje.
- **Repaso:** lista de preguntas guardadas con [Repasar], con botón [Preguntarle a TutorIA] y [Quitar de repaso] por cada una.
- **Suscripción:** plan activo, fecha de vencimiento, botón [Renovar/Cambiar plan], historial de pagos (recibos de Stripe).
- **Monedero TutorIA:** saldo actual, mensajes restantes del mes, mensajes extra disponibles, [Abonar saldo], [Comprar 30 mensajes ($9)], historial de recargas.
- **Cuenta:** correo, [Cambiar contraseña], [Cerrar sesión] (con confirmación), [Eliminar cuenta] (doble confirmación + reautenticación; borra datos conforme a privacidad).

---

## 10. Navegación y estados globales (resumen de botones)

| Pantalla | Botones obligatorios |
|---|---|
| Todas (excepto examen en curso) | ← Regresar, 🏠 Inicio, menú, Perfil |
| Login/Registro | ← Volver, ¿Olvidaste tu contraseña?, Reenviar código |
| Pagos | Elegir plan ×3, Cerrar sesión |
| Dentro de examen/ejercicio/nivel | Anterior, Siguiente, mapa de preguntas, Terminar (confirmar), Salir (confirmar con advertencia) |
| Resultado de examen/nivel | Reintentar, Volver, Enviar a TutorIA (donde aplique) |
| TutorIA | Nueva conversación, contador de mensajes, Recargar |
| Modo bloqueado (suscripción vencida) | Renovar suscripción, Perfil (solo lectura), Cerrar sesión |

Estados que la UI debe manejar siempre: cargando (spinner), error de red (reintentar), sesión expirada (redirigir a login conservando a dónde iba), sin conexión a mitad de examen (guardar respuestas localmente y sincronizar al reconectar).

---

## 11. Correcciones aplicadas sobre el diagrama original

1. Flujo de Google ya NO se salta el pago: ambas rutas de registro pasan por el paywall.
2. Precio anual corregido: **$949** (no $1,049).
3. Ejercicios de Materias unificados en **20 preguntas** (el diagrama decía 20 y 15).
4. Distribución del simulador y del banco alineada a las **10 materias reales del ECOEMS** con sus cuotas oficiales (128 reactivos).
5. Textos de lectura: originales precargados en el banco, no "buscados en la red".
6. Agregados: recuperación de contraseña, verificación con reenvío, modo bloqueado por expiración, botones de regresar/salir/confirmar en todos los flujos, límites y recargas de TutorIA, manejo de errores de pago y de API.
