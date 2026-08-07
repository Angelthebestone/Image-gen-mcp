## Why

Los agentes de IA (como los que se ejecutan vía MCP) no pueden acceder directamente a ChatGPT web para generar imágenes, lo que obliga a hacerlo manualmente en el navegador y luego mover archivos a mano. Un MCP server que automatice la generación de imágenes en ChatGPT y las guarde localmente elimina ese paso manual y habilita flujos de trabajo automatizados de creación de imágenes.

## What Changes

- **Nuevo MCP server** (`image-generation`) implementado en TypeScript/Node.js con el SDK oficial de MCP y Playwright.
- **Automatización de ChatGPT web**: abre `chatgpt.com` en un navegador con perfil persistente, envía prompts de generación de imágenes y espera a que ChatGPT termine de generar la imagen.
- **Autenticación por perfil persistente**: el usuario inicia sesión una sola vez manualmente en el navegador que abre el MCP; la sesión queda guardada en un perfil de Chromium para usos futuros.
- **Guardado de imágenes**: el MCP descarga la imagen generada y la guarda en una carpeta configurada o, por defecto, en la carpeta de Descargas del sistema.
- **Configuración de carpeta de salida**: un tool permite consultar y cambiar la carpeta destino en tiempo de ejecución, y el LLM puede indicar una ruta de guardado específica en cualquier invocación.
- **Nombre de archivo personalizado**: el LLM puede elegir el nombre del archivo al guardar (con sanitización y unicidad automáticas).
- **Edición de imágenes**: el LLM puede enviar una instrucción de edición en texto para modificar la imagen generada (por ejemplo, "cambia el fondo a rojo") y guardar el resultado.
- **Relación de aspecto configurable**: el LLM puede indicar la relación de aspecto deseada (cuadrada, horizontal o vertical) usando el control de la interfaz de ChatGPT, tanto al generar como al editar.
- **Tools MCP expuestos**:
  - `generate_image(prompt, save_path?, filename?, aspect_ratio?)` — genera la imagen y la guarda.
  - `edit_image(edit_instruction, save_path?, filename?, aspect_ratio?)` — edita la imagen generada más reciente y guarda el resultado.
  - `get_output_folder()` — devuelve la carpeta de salida actual.
  - `set_output_folder(folder)` — cambia la carpeta de salida.
  - `get_session_status()` — indica si la sesión de ChatGPT está activa.
- **Sin cambios a ChatGPT**: no se modifica la API ni el sitio web; se automatiza la interfaz pública.

## Capabilities

### New Capabilities

- `chatgpt-image-generation`: conexión automatizada a ChatGPT web con sesión persistente, envío de prompts de generación de imágenes y obtención de la imagen resultante.
- `image-output`: gestión de la carpeta de salida (configurable o Descargas) y guardado de las imágenes generadas con nombres únicos.

### Modified Capabilities

<!-- Sin cambios: no existen specs previas en este proyecto. -->

## Impact

- **Código nuevo**: paquete Node.js/TypeScript con el server MCP (`src/index.ts`), módulos de navegador/automatización (`src/browser.ts`), generación y edición (`src/chatgpt.ts`) y almacenamiento (`src/storage.ts`).
- **Dependencias**: `@modelcontextprotocol/sdk`, `playwright` (Chromium), `node:fs`/`node:path` estándar, `typescript` como dev-dependency.
- **Configuración**: archivo `image-generation.json` o variables de entorno para carpeta de salida por defecto y ruta del perfil del navegador.
- **Sistema de archivos**: carpeta del perfil persistente de Chromium y carpeta de salida de imágenes (Descargas u otra).
- **Riesgos**: cambios en el DOM de ChatGPT web pueden romper los selectores; dependencia de sesión OpenAI activa.
