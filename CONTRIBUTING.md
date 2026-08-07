# Contributing

Thanks for your interest in contributing to the Image Generation MCP Server!

## Getting started

1. Fork the repository.
2. Clone your fork and install dependencies:

   ```bash
   npm install --include=dev
   npm run build
   ```

3. Create a branch for your changes.
4. Make your changes and ensure they pass:

   ```bash
   npm run build
   npm run typecheck
   ```

5. Commit with a clear message and open a pull request.

## Development notes

- The server automates ChatGPT's web UI with Playwright. Selectors live in `src/selectors.ts` and are centralized on purpose — ChatGPT changes its DOM often, so keep selector updates in that single file.
- The visual editor (canvas-based) is intentionally **not** automated. Editing is done via chat instruction; see `README.md > Limitations`.
- Keep changes minimal: no speculative abstractions, no unnecessary fallbacks. Follow the existing single-path-of-success style.

## Testing

There is no automated test suite yet — the integration flow requires a real ChatGPT session. When adding features, verify against the live site if possible and document what you tested.

## Code style

- TypeScript, strict mode.
- ESM (`"type": "module"`).
- No comments unless the logic isn't self-evident.
