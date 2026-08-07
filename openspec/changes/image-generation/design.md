## Context

See proposal.md — Why. Se construye un MCP server nuevo en un proyecto vacío (sin código existente). El servidor debe automatizar ChatGPT web (interfaz pública, sin API oficial de generación) y guardar imágenes localmente. El usuario confirmó: TypeScript/Node.js con el SDK oficial de MCP, y autenticación por perfil persistente de Chromium (el usuario se loguea una sola vez manualmente).

## Goals / Non-Goals

**Goals:**
- Arquitectura modular que aísle: servidor MCP, automatización del navegador, lógica de ChatGPT y almacenamiento de archivos.
- Robustez ante variaciones de la interfaz de ChatGPT (selectores con esperas y reintentos).
- Persistencia de sesión de OpenAI y de la configuración de carpeta de salida entre ejecuciones.
- Tools MCP con entradas/salidas tipadas y errores descriptivos.

**Non-Goals:**
- No usar la API oficial de OpenAI (requiere cuenta de pago y el objetivo es usar la web).
- No implementar login automático con credenciales (decidido: perfil persistente).
- No soportar múltiples cuentas simultáneas ni gestión de conversaciones/historial de ChatGPT.
- No ser un cliente general de ChatGPT: solo generación de imágenes.
- No automatizar el editor visual avanzado de ChatGPT (pincel, selección de regiones): la edición es por instrucción de texto.

## Decisions

**D1 — SDK oficial de MCP (`@modelcontextprotocol/sdk`) en TypeScript**
El server se escribe con el SDK oficial de MCP sobre Node.js. Es el estándar para MCP servers y soporta transporte stdio (ideal para integrarse con clientes locales como Command Code, Claude Desktop, etc.).
- *Alternativa*: SDK de Python — descartada por elección del usuario (TypeScript/Node.js).

**D2 — Playwright (Chromium) con perfil persistente para la sesión**
Se usa Playwright con un perfil de Chromium persistente en disco (`launchPersistentContext`). El usuario inicia sesión manualmente la primera vez; las cookies de OpenAI se guardan en el perfil y se reutilizan en ejecuciones posteriores. La carpeta del perfil se configura en el archivo de configuración (por defecto `~/.image-generation/browser-profile`).
- *Alternativa*: Puppeteer — Playwright tiene mejor soporte de perfiles persistentes y esperas automáticas; también es el estándar de facto en automatización MCP.
- *Alternativa*: credenciales + login automático — descartada: frágil ante CAPTCHAs/2FA y menos seguro (ver D5).

**D3 — Selectores configurables + espera de red**
La automatización usa selectores CSS definidos en un único módulo de constantes (fácil de actualizar si ChatGPT cambia el DOM), combinados con esperas de Playwright (auto-wait) y un timeout configurable (por defecto 180 s) para la generación. La detección de finalización se hace esperando la aparición de la imagen generada en el hilo de conversación, con verificación de que no siga "generando".

**D4 — Guardado local con nombres únicos y personalizables**
La imagen se obtiene del elemento resultante en el DOM (atributo `src` o descarga de la URL) y se escribe con `fs`. Nombre por defecto: `chatgpt-<timestamp>-<sufijo>.png`; si el usuario indica un nombre, se sanitizan caracteres inválidos (reemplazando `\ / : * ? " < > |`), se añade la extensión si falta y se añade un contador si el archivo ya existe. La carpeta de salida por defecto es la carpeta Descargas del sistema (`path.join(os.homedir(), "Downloads")`).

**D5 — Configuración en archivo JSON local**
Un archivo de configuración (por defecto `~/.image-generation/config.json`) guarda: carpeta de salida y ruta del perfil del navegador. Simple, sin base de datos. **El archivo de configuración y el perfil del navegador NO deben guardar credenciales en texto plano** — las credenciales viven únicamente en las cookies del perfil de Chromium.

**D6 — Tools MCP**
- `generate_image(prompt, save_path?, filename?, aspect_ratio?)` → genera y guarda; devuelve ruta absoluta del archivo.
- `edit_image(edit_instruction, save_path?, filename?, aspect_ratio?)` → envía la instrucción de edición en el hilo actual (ChatGPT edita la imagen más reciente de la conversación) y guarda el resultado; devuelve ruta absoluta.
- `get_output_folder()` → carpeta de salida actual.
- `set_output_folder(folder)` → valida y cambia la carpeta de salida.
- `get_session_status()` → estado de la sesión de ChatGPT.

**D6.1 — Relación de aspecto**
Valores soportados: `cuadrada`, `horizontal`, `vertical` (mapeados al control de relación de aspecto de la interfaz de ChatGPT, que normalmente tiene opciones de cuadrado, horizontal 16:9 y vertical 9:16). Se aplica tras abrir el panel de generación y antes de enviar el prompt. Si el control no aparece, se falla con error descriptivo (sin enviar el prompt).

**D6.2 — Edición**
La edición se implementa como un prompt de seguimiento en el mismo hilo de conversación (ej. "edita la última imagen: <instrucción>"), no usando el editor visual de pincel de ChatGPT. Esto mantiene el guardado de resultados y las mismas rutas de espera de imagen que la generación.

**D7 — Módulos**
- `src/index.ts` — arranque del server MCP y registro de tools.
- `src/config.ts` — carga/persistencia de configuración.
- `src/browser.ts` — lanzamiento del contexto persistente de Chromium y helper de estado de sesión.
- `src/chatgpt.ts` — automatización de ChatGPT web (navegación, envío de prompt, espera de imagen, edición).
- `src/storage.ts` — resolución de carpeta de salida, sanitización de nombres y guardado con nombre único.
- `src/selectors.ts` — selectores CSS centralizados (incluidos los del control de relación de aspecto).

**D8 — Implementación en tracks paralelos con 3 subagentes**
El trabajo se parte en 3 tracks independientes que los subagentes pueden implementar en paralelo, con contratos de interfaz explícitos (tipos/firmas) para minimizar conflictos:

- **Track A — Setup + Config** (subagente 1): `package.json`, `tsconfig.json`, deps, `src/config.ts`. Expone la interfaz de configuración que consumen B y C.
- **Track B — Almacenamiento** (subagente 2): `src/storage.ts` puro, sin dependencia del navegador. Interfaz declarada, lista para consumir por el server.
- **Track C — Navegador + ChatGPT** (subagente 3): `src/browser.ts`, `src/selectors.ts`, `src/chatgpt.ts`. Interfaz de automatización declarada, consumida por el server.
- **Track D — Server MCP + tools + build** (integración): une A/B/C, implementa `src/index.ts`, compila y prueba.

**Contratos de interfaz (variables a declarar):**

- `config.ts` → `interface Config { outputFolder: string; browserProfilePath: string; generationTimeoutMs: number }` y `function loadConfig(): Config`, `function saveConfig(patch: Partial<Config>): void`.
- `storage.ts` → `function resolveOutputDir(requestedPath?: string): string` (usa `save_path` si es válido, si no la config), `function uniqueFilePath(dir: string, filename: string): string` (sanitiza, añade extensión, añade sufijo si existe), `function saveImageFromUrl(url: string, filePath: string): Promise<string>` (descarga y escribe; devuelve ruta absoluta).
- `browser.ts` → `function launchBrowser(config: Config): Promise<BrowserContext>` (contexto persistente), `function isLoggedIn(page: Page): Promise<boolean>`.
- `chatgpt.ts` → `interface GenerateOptions { aspectRatio?: "cuadrada" | "horizontal" | "vertical" }`, `function generateImage(page: Page, prompt: string, opts?: GenerateOptions): Promise<{ url: string }>`, `function editImage(page: Page, instruction: string, opts?: GenerateOptions): Promise<{ url: string }>`.
- `selectors.ts` → constantes de selectores CSS agrupadas.

**Directriz transversal (para todos los subagentes): soluciones mínimas y eficientes, sin sobre-ingeniería ni fallbacks innecesarios.** Solo se implementa lo que las specs exigen; un único camino de éxito y manejo de errores directo; sin capas de abstracción, configuración especulativa, reintentos artificiales ni código defensivo para casos que no pueden ocurrir. Cualquier necesidad de lógica extra se reporta en lugar de añadirla por cuenta propia.

**Track A y Track B pueden arrancar en paralelo; Track C arranca tras A (necesita `Config`). Track D solo al final.**

## Risks / Trade-offs

- **[Cambios de DOM en ChatGPT web]** → Selectores centralizados en `selectors.ts`, reintentos con mensajes descriptivos ("se esperaba X, se encontró Y"), y updates puntuales al archivo de selectores sin tocar el resto.
- **[Control de relación de aspecto ausente o distinto]** → Fallo descriptivo sin enviar el prompt; el control de aspecto es reciente y puede variar por cuenta/plan (Free vs Plus).
- **[Sesión expirada de OpenAI]** → `get_session_status()` permite detectarlo; error claro en `generate_image` cuando no hay sesión.
- **[Generación lenta o bloqueada por políticas de OpenAI]** → Timeout configurable y error de timeout sin archivos parciales.
- **[Escritura fallida por permisos]** → Error descriptivo; el guardado valida la carpeta antes de escribir.
- **[Ventana del navegador visible durante la generación]** → Aceptado: necesaria para la interacción con ChatGPT; trade-off de UX a cambio de robustez.

## Migration Plan

Proyecto nuevo: no hay migración. Pasos de despliegue: `npm install`, `npx playwright install chromium`, configuración del MCP server en el cliente (ej. Command Code: `npx tsx src/index.ts` o build a `dist/`), primer arranque manual con login en el navegador.

## Open Questions

Ninguna. Las decisiones pendientes (timeout por defecto, nombre de archivo) tienen defaults razonables que no cambian specs ni tareas.
