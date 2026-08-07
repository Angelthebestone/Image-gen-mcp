import { chromium, type BrowserContext, type Page } from "playwright";
import type { Config } from "./config.js";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function launchBrowser(config: Config, headless = true): Promise<BrowserContext> {
  return chromium.launchPersistentContext(config.browserProfilePath, {
    executablePath: CHROME_PATH,
    headless,
    viewport: { width: 1280, height: 800 },
    args: [
      ...(headless ? ["--headless=new"] : []),
      "--disable-blink-features=AutomationControlled",
      "--disable-automation-controlled",
      "--no-first-run",
      "--disable-infobars",
      `--user-agent=${CHROME_UA}`,
    ],
  });
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto("https://chatgpt.com/");
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.waitForSelector('a[data-testid="login-button"], button[data-testid="login-button"]', {
      timeout: 5_000,
    });
    return false;
  } catch {
    return true;
  }
}

export async function ensureSinglePage(context: BrowserContext): Promise<Page> {
  const pages = context.pages();
  const page = pages[0] ?? (await context.newPage());
  for (const extra of pages.slice(1)) {
    await extra.close();
  }
  return page;
}

export function conversationIdFromUrl(url: string): string | null {
  const match = url.match(/\/c\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}
