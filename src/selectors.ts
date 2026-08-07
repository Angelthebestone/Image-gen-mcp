export const SELECTORS = {
  composer: 'div[contenteditable="true"][aria-label="Chatear con ChatGPT"], div[contenteditable="true"][aria-label="Chat with ChatGPT"], div.ProseMirror[contenteditable="true"]',
  sendButton:
    'button[data-testid="composer-send-button"], button[data-testid="send-button"], button[aria-label*="Enviar"], button[aria-label*="Send"]',
  imageResult: 'img[alt^="Imagen generada"], img[alt^="Generated image"], img[alt^="Generated Image"]',
  editImageButton: 'button[aria-label="Editar imagen"]',
  generatingIndicator: '[data-testid="generating"], [class*="generating"]',
  policyError: 'text=infrinja nuestras políticas, text=policies, text=no pudimos generar',
} as const;

export const ASPECT_RATIOS = {
  cuadrada: "1:1",
  horizontal: "16:9",
  vertical: "9:16",
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;
