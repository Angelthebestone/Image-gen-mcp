# Image Generation MCP Server

An [MCP](https://modelcontextprotocol.io) server that automates image generation on **ChatGPT web**, edits images by instruction, and saves them locally — no API keys, no paid OpenAI API.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)

## Features

- **Generate images** in ChatGPT web from a prompt
- **Edit images** by instruction (text-based, in the conversation)
- **Conversation-aware**: returns a `conversation_id` so edits can resume the same thread
- **Flexible output**: default Downloads folder, configurable folder, or per-call `save_path` and `filename`
- **Aspect ratio hints** (`cuadrada` / `horizontal` / `vertical`) injected into the prompt
- **Persistent session**: log in once; the server reuses the session headlessly
- **Policy rejection detection**: fails fast with a clear message instead of waiting for timeout
- **Single browser tab** reused across all requests

## Requirements

- Node.js >= 18
- Google Chrome installed (used headless for automation)
- An OpenAI account with access to ChatGPT (login required once)

## Installation

```bash
npm install
npm run build
```

> Uses the system Chrome — no `npx playwright install chromium` needed.

## Usage in an MCP client

Add the server to your MCP client config (e.g. Command Code, Claude Desktop):

```json
{
  "mcpServers": {
    "image-generation": {
      "command": "node",
      "args": ["/path/to/image-generation/dist/index.js"],
      "cwd": "/path/to/image-generation"
    }
  }
}
```

For development (hot reload):

```json
{
  "mcpServers": {
    "image-generation": {
      "command": "npx",
      "args": ["tsx", "/path/to/image-generation/src/index.ts"],
      "cwd": "/path/to/image-generation"
    }
  }
}
```

## First run (manual login)

1. Start the server without a saved session (e.g. `npx tsx src/index.ts`). Since no session is detected, it opens a **visible** window with the ChatGPT login page.
2. Log in to ChatGPT in that window (your normal account).
3. The session is saved in the persistent profile `~/.image-generation/browser-profile`.
4. From then on, the server runs **headless** (no window) and reuses the session.

To reset the session (expired or different account), delete the profile:

```bash
rm -rf ~/.image-generation/browser-profile
```

## Tools

| Tool | Description |
|------|-------------|
| `generate_image(prompt, save_path?, filename?, aspect_ratio?)` | Generates an image and saves it. Returns the absolute path and the `conversation_id`. |
| `edit_image(edit_instruction, conversation_id?, save_path?, filename?, aspect_ratio?)` | Edits the image in the given conversation (or the most recent) and saves the result. |
| `get_conversation_id()` | Returns the current conversation ID (to resume it when editing). |
| `get_output_folder()` | Returns the current output folder. |
| `set_output_folder(folder)` | Changes the output folder (must exist). |
| `get_session_status()` | Indicates whether the ChatGPT session is active. |

### Parameters

- `prompt` / `edit_instruction`: required text.
- `conversation_id`: ID returned by `generate_image`; if omitted, edits the current conversation.
- `save_path`: optional destination directory (defaults to the configured folder or Downloads).
- `filename`: optional file name; invalid characters are sanitized, `.png` is added if missing, and a numeric suffix avoids overwrites.
- `aspect_ratio`: `cuadrada` | `horizontal` | `vertical` (optional). Injected into the prompt (e.g. `(formato 16:9)`) since ChatGPT does not expose a UI control for it.

## Configuration

The server persists its config in `~/.image-generation/config.json`:

```json
{
  "outputFolder": "C:/Users/<user>/Downloads",
  "browserProfilePath": "C:/Users/<user>/.image-generation/browser-profile",
  "generationTimeoutMs": 180000
}
```

## Behavior

- **Headless**: after the initial login, no window opens; a single persistent page is reused for all requests.
- **Single tab**: exactly one page is always kept active.
- **Policy rejection**: if ChatGPT rejects generation (content policy message), the server fails fast with the message instead of waiting for the timeout.
- **Persistent session**: the profile stores cookies; the session is reused across runs.

## Development

```bash
npm run build       # compile TypeScript
npm run typecheck   # type-check without emitting
npm run dev         # run with hot reload
```

## Limitations

- Requires an active ChatGPT session (manual login the first time).
- Selectors target ChatGPT's current DOM; if the site changes, `src/selectors.ts` may need updates.
- The visual editor (brush, region selection, canvas controls) is **not** automated — it's a proprietary canvas without accessible controls. Editing is done via chat instruction.
- Cloudflare may block headless on some networks; the real Chrome user agent mitigates this.

## License

[MIT](LICENSE)
