# ECOEMS Quest — carpeta de arranque v4.2

Esta carpeta NO es la app en producción — es el punto de partida que le vas
a dar a Claude Code para que construya la app real (frontend + backend +
base de datos + pagos) en tu computadora.

## Qué hay aquí
1. **PROMPT_CLAUDE_CODE.md** — el prompt listo para pegar en Claude Code.
2. **ECOEMS_Quest_Spec_Final.md** — especificación funcional completa.
3. **ECOEMS_Quest_Diagrama_Flujo_v1.2.docx** — diagrama de flujo con las
   dinámicas competitivas (Battle Royale, Arena, Clanes, Marcador Global)
   y las Rachas de estudio.
4. **demo/ECOEMS_Quest_Demo_v4.2.html** — demo navegable, referencia visual
   (ábrelo directo en tu navegador para probarlo). Incluye un botón
   "Simular siguiente día" en Perfil, solo para probar la racha sin
   esperar 24 horas — no existe en la app real.

## Paso 1 — pon esta carpeta en tu computadora
Descomprime el .zip donde quieras trabajar, por ejemplo:
`~/Proyectos/ecoquest/`

## Paso 2 — conéctala a tu repositorio "ecoquest" en GitHub
Si el repo `ecoquest` ya existe en tu cuenta de GitHub pero está vacío o es
distinto a esta carpeta, entra a la carpeta en la terminal y corre:

```bash
cd ~/Proyectos/ecoquest
git init
git add .
git commit -m "Punto de partida: spec, diagrama de flujo y demo v4.1"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/ecoquest.git
git push -u origin main --force
```

> Usa `--force` solo si el repo remoto está vacío o si no te importa
> reemplazar lo que ya tenga. Si ya tiene contenido que quieres conservar,
> quita `--force` y resuelve el conflicto que git te muestre, o dime qué
> tiene el repo actual y te doy los comandos exactos para fusionarlo.

Si nunca configuraste git con tu cuenta en esta computadora, antes corre:
```bash
git config --global user.name "Tu nombre"
git config --global user.email "tu-correo@ejemplo.com"
```
Y asegúrate de tener sesión iniciada en GitHub desde la terminal (con
`gh auth login` si usas la GitHub CLI, o con tu usuario/token cuando git
te lo pida al hacer push).

## Paso 3 — abre Claude Code en esa misma carpeta
```bash
cd ~/Proyectos/ecoquest
claude
```
Copia y pega el contenido completo de PROMPT_CLAUDE_CODE.md. Claude Code
hará el commit y push de cada etapa a este mismo repositorio a medida que
avance, si se lo pides ("haz commit y push de esta etapa").

## Pendientes de tu lado (no urgen para la Etapa 1)
- Cuentas y llaves: Supabase, Stripe (modo prueba), Vercel y
  console.anthropic.com — para la Etapa 2.
- Banco de preguntas real: mínimo 60 reactivos por materia para lanzar.
- Dominio (ecoemsquest.mx o similar).
- Datos fiscales en Stripe antes del primer cobro real.
- Aviso de privacidad y términos (usuarios menores de edad).
- Para Battle Royale/Arena: nada de tu lado por ahora, se resuelve con
  Supabase Realtime, ya incluido en el prompt de la Etapa 1.
