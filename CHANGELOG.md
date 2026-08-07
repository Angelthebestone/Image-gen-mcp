# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
