# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately by opening a [GitHub security advisory](https://github.com/<owner>/<repo>/security/advisories/new) or by emailing the maintainers.

Please do **not** open a public issue for security vulnerabilities.

## What this project stores

- **Browser profile** (`~/.image-generation/browser-profile`): contains your ChatGPT session cookies. Treat it like a password — it grants access to your account.
- **Config** (`~/.image-generation/config.json`): output folder and browser profile path only — no credentials in plain text.

## Best practices

- Never commit the browser profile or config to a repository (see `.gitignore`).
- If you suspect your session was exposed, delete the profile and re-login.
- The server never stores your ChatGPT credentials; it only uses the session cookies from the profile.
