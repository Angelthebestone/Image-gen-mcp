## 1. Subagente 1 — Setup + Configuración

- [x] 1.1 Inicializar paquete Node.js/TypeScript (`package.json`, `tsconfig.json`, estructura `src/`)
- [x] 1.2 Instalar dependencias: `@modelcontextprotocol/sdk`, `playwright`, `typescript`, `tsx`, `@types/node`
- [x] 1.3 Instalar el navegador Chromium de Playwright (`npx playwright install chromium`)
- [x] 1.4 Crear script `build` y `start` en `package.json` (build a `dist/` y arranque del server MCP)
- [x] 1.5 Implementar `src/config.ts` con la interfaz del design D8: `interface Config { outputFolder: string; browserProfilePath: string; generationTimeoutMs: number }`, `loadConfig(): Config`, `saveConfig(patch: Partial<Config>): void`
- [x] 1.6 Usar defaults: carpeta Descargas del sistema, perfil en `~/.image-generation/browser-profile`, timeout de generación 180 s
- [x] 1.7 Persistir cambios de configuración en disco de forma atómica

## 2. Subagente 2 — Almacenamiento

- [x] 2.1 Implementar `src/storage.ts` (sin dependencia del navegador) con la interfaz del design D8: `resolveOutputDir(requestedPath?: string): string`, `uniqueFilePath(dir: string, filename: string): string`, `saveImageFromUrl(url: string, filePath: string): Promise<string>`
- [x] 2.2 Resolución de carpeta de salida: `save_path` si es válido, si no la config (o Descargas por defecto)
- [x] 2.3 Sanitización de nombres: caracteres inválidos, añadir extensión si falta, sufijo numérico si el archivo existe
- [x] 2.4 Descarga/extracción de la imagen desde la URL y guardado en la ruta destino
- [x] 2.5 Validar permisos de escritura de la carpeta y reportar errores claros

## 3. Subagente 3 — Navegador + ChatGPT

- [x] 3.1 Implementar `src/selectors.ts`: selectores CSS centralizados (incluidos los del control de relación de aspecto)
- [x] 3.2 Implementar `src/browser.ts` con la interfaz del design D8: `launchBrowser(config: Config): Promise<BrowserContext>` (contexto persistente), `isLoggedIn(page: Page): Promise<boolean>`
- [x] 3.3 Implementar `src/chatgpt.ts` con la interfaz del design D8: `generateImage(page, prompt, opts?)`, `editImage(page, instruction, opts?)` (con `GenerateOptions { aspectRatio? }`)
- [x] 3.4 Navegación a ChatGPT web y espera de la interfaz lista
- [x] 3.5 Envío del prompt en el modo de generación de imágenes (GPT-4o/DALL·E) y espera de la imagen generada con timeout configurable
- [x] 3.6 Selección de relación de aspecto (`cuadrada`/`horizontal`/`vertical`) en el control de ChatGPT antes de enviar el prompt, con validación de valores y fallo descriptivo si el control no está disponible
- [x] 3.7 Edición: envío de la instrucción como prompt de seguimiento en el mismo hilo, espera de la imagen editada
- [x] 3.8 Manejar errores: prompt vacío, sin sesión, timeout, generación rechazada, interfaz no responde (con mensajes descriptivos)

## 4. Integrador — Server MCP, tools y pruebas

- [x] 4.1 Implementar `src/index.ts`: arranque del server MCP (transporte stdio) y registro de tools
- [x] 4.2 Implementar tool `generate_image(prompt, save_path?, filename?, aspect_ratio?)` que genera y guarda, devolviendo la ruta absoluta
- [x] 4.3 Implementar tool `edit_image(edit_instruction, save_path?, filename?, aspect_ratio?)` que edita la imagen más reciente del hilo y guarda, devolviendo la ruta absoluta
- [x] 4.4 Implementar tool `get_output_folder()` que devuelve la carpeta de salida actual
- [x] 4.5 Implementar tool `set_output_folder(folder)` que valida y cambia la carpeta de salida
- [x] 4.6 Implementar tool `get_session_status()` que reporta si la sesión de ChatGPT está activa
- [x] 4.7 Verificar que el server compila sin errores (`npm run build`) y responde al arranque del cliente MCP
- [x] 4.8 Probar flujo completo: primer arranque, login manual, generación de imagen y guardado en Descargas
- [x] 4.9 Probar cambio de carpeta de salida y persistencia entre ejecuciones
- [x] 4.10 Probar casos de error: prompt vacío, sin sesión, carpeta inválida/no escribible
- [x] 4.11 Verificar que una segunda ejecución reutiliza la sesión guardada sin login
- [x] 4.12 Probar `generate_image` con `save_path`, `filename` y `aspect_ratio` (cada combinación y sus errores)
- [x] 4.13 Probar `edit_image`: edición exitosa, instrucción vacía, sin imagen previa y timeout
- [x] 4.14 Probar `set_output_folder` con carpeta inválida y nombre de archivo con caracteres inválidos
- [x] 4.15 Documentar la configuración del MCP server en clientes (ej. Command Code) y el primer-login manual
