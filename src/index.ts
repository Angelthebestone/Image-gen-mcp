import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { statSync } from "node:fs";
import { loadConfig, saveConfig } from "./config.js";
import { launchBrowser, isLoggedIn, ensureSinglePage, conversationIdFromUrl } from "./browser.js";
import { generateImage, editImage } from "./chatgpt.js";
import { resolveOutputDir, uniqueFilePath, saveImage } from "./storage.js";
import { ASPECT_RATIOS, type AspectRatio } from "./selectors.js";

const server = new McpServer({ name: "image-generation", version: "0.1.0" });
const config = loadConfig();

// Headless Chrome (works with Cloudflare) — no visible window, ever.
// The single persistent page is reused for every request.
// If no session exists yet, relaunch visible so the user can log in manually.
let browser = await launchBrowser(config);
let page = await ensureSinglePage(browser);
await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded" });
let loggedIn = await isLoggedIn(page);
if (!loggedIn) {
  await browser.close();
  // No session: open a VISIBLE window so the user can log in manually.
  browser = await launchBrowser(config, false);
  page = await ensureSinglePage(browser);
  await page.goto("https://chatgpt.com/auth/login", { waitUntil: "domcontentloaded" });
}

function resolveFilename(filename?: string): string {
  return filename && filename.trim() ? filename.trim() : `chatgpt-${Date.now()}`;
}

async function handleImageResult(buffer: Buffer, savePath?: string, filename?: string): Promise<string> {
  const dir = resolveOutputDir(savePath);
  const filePath = uniqueFilePath(dir, resolveFilename(filename));
  saveImage(buffer, filePath);
  return filePath;
}

function currentConversationId(): string | null {
  return conversationIdFromUrl(page.url());
}

function formatResult(message: string): string {
  const convId = currentConversationId();
  return convId ? `${message} | conversation_id: ${convId}` : message;
}

server.registerTool(
  "generate_image",
  {
    title: "Generar imagen",
    description:
      "Genera una imagen en ChatGPT web a partir de un prompt y la guarda localmente. Devuelve la ruta del archivo y el conversation_id de la conversación (útil para edit_image). Acepta save_path, filename y aspect_ratio (cuadrada | horizontal | vertical) opcionales; el aspect_ratio se indica en el prompt (formato 1:1 / 16:9 / 9:16) ya que ChatGPT no expone un control para ello.",
    inputSchema: {
      prompt: z.string().min(1, "El prompt es obligatorio"),
      save_path: z.string().optional(),
      filename: z.string().optional(),
      aspect_ratio: z.enum(Object.keys(ASPECT_RATIOS) as [string, ...string[]]).optional(),
    },
  },
  async ({ prompt, save_path, filename, aspect_ratio }) => {
    try {
      const { buffer } = await generateImage(page, prompt, { aspectRatio: aspect_ratio as AspectRatio | undefined });
      const path = await handleImageResult(buffer, save_path, filename);
      return { content: [{ type: "text", text: formatResult(`Imagen guardada en: ${path}`) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
    }
  },
);

server.registerTool(
  "edit_image",
  {
    title: "Editar imagen",
    description:
      "Edita la imagen de la conversación (usa conversation_id devuelto por generate_image; si se omite, edita la más reciente del hilo actual) y guarda el resultado. Devuelve la ruta del archivo y el conversation_id.",
    inputSchema: {
      edit_instruction: z.string().min(1, "La instrucción de edición es obligatoria"),
      conversation_id: z.string().optional(),
      save_path: z.string().optional(),
      filename: z.string().optional(),
      aspect_ratio: z.enum(Object.keys(ASPECT_RATIOS) as [string, ...string[]]).optional(),
    },
  },
  async ({ edit_instruction, conversation_id, save_path, filename, aspect_ratio }) => {
    try {
      const { buffer } = await editImage(page, edit_instruction, {
        conversationId: conversation_id,
        aspectRatio: aspect_ratio as AspectRatio | undefined,
      });
      const path = await handleImageResult(buffer, save_path, filename);
      return { content: [{ type: "text", text: formatResult(`Imagen editada guardada en: ${path}`) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
    }
  },
);

server.registerTool(
  "get_conversation_id",
  {
    title: "Obtener ID de conversación",
    description:
      "Devuelve el ID de la conversación de ChatGPT actual (extraído del URL). Se usa para retomar la misma conversación al editar una imagen.",
    inputSchema: {},
  },
  async () => {
    const convId = currentConversationId();
    return { content: [{ type: "text", text: convId ?? "No hay conversación activa" }] };
  },
);

server.registerTool(
  "get_output_folder",
  {
    title: "Obtener carpeta de salida",
    description: "Devuelve la carpeta de salida configurada actualmente.",
    inputSchema: {},
  },
  async () => {
    return { content: [{ type: "text", text: loadConfig().outputFolder }] };
  },
);

server.registerTool(
  "set_output_folder",
  {
    title: "Cambiar carpeta de salida",
    description: "Valida y cambia la carpeta de salida donde se guardan las imágenes.",
    inputSchema: {
      folder: z.string().min(1, "La carpeta es obligatoria"),
    },
  },
  async ({ folder }) => {
    try {
      if (!statSync(folder).isDirectory()) throw new Error("no es un directorio");
      saveConfig({ outputFolder: folder });
      return { content: [{ type: "text", text: `Carpeta de salida cambiada a: ${folder}` }] };
    } catch {
      return { content: [{ type: "text", text: `Error: '${folder}' no es una carpeta válida` }] };
    }
  },
);

server.registerTool(
  "get_session_status",
  {
    title: "Estado de sesión",
    description: "Indica si la sesión de ChatGPT está activa o se requiere login manual.",
    inputSchema: {},
  },
  async () => {
    const loggedInNow = await isLoggedIn(page);
    return {
      content: [
        { type: "text", text: loggedInNow ? "Sesión activa" : "No autenticado. Abra el navegador e inicie sesión manualmente." },
      ],
    };
  },
);

await server.connect(new StdioServerTransport());
