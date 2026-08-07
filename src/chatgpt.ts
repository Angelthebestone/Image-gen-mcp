import type { Page } from "playwright";
import { loadConfig } from "./config.js";
import { SELECTORS, ASPECT_RATIOS, type AspectRatio } from "./selectors.js";

export interface GenerateOptions {
  aspectRatio?: AspectRatio;
  conversationId?: string;
}

function validatePrompt(prompt: string): void {
  if (!prompt.trim()) throw new Error("El prompt es obligatorio");
}

function aspectRatioHint(aspectRatio: AspectRatio): string {
  if (!(aspectRatio in ASPECT_RATIOS)) {
    throw new Error(`Relación de aspecto inválida. Valores válidos: ${Object.keys(ASPECT_RATIOS).join(", ")}`);
  }
  return ` (formato ${ASPECT_RATIOS[aspectRatio]})`;
}

async function navigateToConversation(page: Page, conversationId: string): Promise<void> {
  const currentId = page.url().match(/\/c\/([a-f0-9-]+)/i)?.[1];
  if (currentId !== conversationId) {
    await page.goto(`https://chatgpt.com/c/${conversationId}`, { waitUntil: "domcontentloaded" });
  }
}

async function clickEditButton(page: Page): Promise<void> {
  const editBtn = page.locator(SELECTORS.editImageButton).last();
  try {
    await editBtn.click({ timeout: 5_000 });
  } catch {
    // Editor button not available; proceed with chat prompt edit.
  }
}

async function sendPrompt(page: Page, prompt: string, opts?: GenerateOptions): Promise<void> {
  validatePrompt(prompt);
  const composer = page.locator(SELECTORS.composer).first();
  await composer.waitFor({ state: "visible", timeout: 30_000 });
  await composer.fill(prompt);
  const sendButton = page.locator(SELECTORS.sendButton).first();
  await sendButton.waitFor({ state: "visible", timeout: 5_000 });
  await sendButton.click();
}

async function waitForImage(page: Page, timeoutMs: number): Promise<{ url: string; buffer: Buffer }> {
  const result = page.locator(SELECTORS.imageResult).last();
  const error = page.locator(SELECTORS.policyError).last();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // Policy rejection: fail fast instead of waiting the full timeout
    if (await error.count()) {
      const text = (await error.first().textContent())?.trim();
      throw new Error(`ChatGPT rechazó la generación por políticas de contenido: ${text || "sin detalles"}`);
    }
    if (await result.count()) {
      const src = await result.last().getAttribute("src");
      if (src) {
        // Download via the page itself so cookies/auth headers apply
        const buffer = await page.evaluate(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return Array.from(new Uint8Array(await res.arrayBuffer()));
        }, src);
        return { url: src, buffer: Buffer.from(buffer) };
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Timeout esperando la imagen generada");
}

export async function generateImage(page: Page, prompt: string, opts?: GenerateOptions): Promise<{ url: string; buffer: Buffer }> {
  if (opts?.conversationId) await navigateToConversation(page, opts.conversationId);
  const fullPrompt = opts?.aspectRatio ? `${prompt}${aspectRatioHint(opts.aspectRatio)}` : prompt;
  await sendPrompt(page, fullPrompt, opts);
  const { generationTimeoutMs } = loadConfig();
  const result = await waitForImage(page, generationTimeoutMs);
  return result;
}

export async function editImage(page: Page, instruction: string, opts?: GenerateOptions): Promise<{ url: string; buffer: Buffer }> {
  if (!instruction.trim()) throw new Error("La instrucción de edición es obligatoria");
  if (opts?.conversationId) await navigateToConversation(page, opts.conversationId);
  await clickEditButton(page);
  const editPrompt = opts?.aspectRatio
    ? `Edita la última imagen generada: ${instruction}${aspectRatioHint(opts.aspectRatio)}`
    : `Edita la última imagen generada: ${instruction}`;
  await sendPrompt(page, editPrompt, opts);
  const { generationTimeoutMs } = loadConfig();
  const result = await waitForImage(page, generationTimeoutMs);
  return result;
}
