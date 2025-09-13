# AI Context Documentation

This directory contains shared AI context and documentation for the OpenShift Console project.

## Files

- **`context.md`** - Primary AI context with project structure, conventions, and development guidelines
- **`README.md`** - This file, explaining the AI context structure

## Usage

AI assistants (Claude, Cursor, etc.) reference these files to understand:
- Project architecture and key packages
- Development workflows and commands  
- Code conventions and best practices
- Testing and deployment procedures

## Adding New Context

When adding new AI context:
1. Consider if it belongs in the main `context.md` or needs a separate file
2. Update assistant-specific config files (CLAUDE.md, .cursor/context.md) if needed
3. Keep context focused and actionable for AI assistants