# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-10-13

### Fixed

- Server no longer crashes on startup when the Chrome profile is already in use by another instance (e.g. Claude Desktop alongside Claude Code). The browser now launches on first tool use and a locked profile returns a clear error.

## [0.1.0]

### Added

- Initial MCP server implementation:
  - `generate_image` tool (prompt, optional save_path/filename/aspect_ratio)
  - `edit_image` tool (instruction, optional conversation_id/save_path/filename/aspect_ratio)
  - `get_conversation_id`, `get_output_folder`, `set_output_folder`, `get_session_status` tools
  - Headless Chrome automation (system Chrome, `--headless=new`, real user agent)
  - Persistent session profile with visible-window login on first run
  - Policy rejection fast-fail detection
  - Aspect ratio injected into prompt (no UI control exists)
  - Conversation resume via `conversation_id`
  - Single persistent browser tab
