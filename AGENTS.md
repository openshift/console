# AGENTS.md – **Machine-readable briefing for all AI coding agents**  
(Claude Code, Cursor, GitHub Copilot, Gemini Code Assist, CodeRabbit, etc.)

This is the entry point for AI-assisted development. Read this first and follow links for details.

## Usage
All AI assistants reference these files to understand:
- Project architecture and key packages
- Development workflows and commands  
- Code conventions and best practices
- Testing and deployment procedures

## Project Overview
- **Monorepo:** `frontend/` (React + TypeScript, yarn workspaces), `pkg/` - Go backend code, `cmd/` - Go CLI commands
- **Dynamic plugins:** `frontend/packages/` (dev-console, knative, helm, pipelines, etc.)
- **Key Packages:** `@console/dynamic-plugin-sdk` (public API—no breaking changes), `@console/shared` (utils), `@console/internal` (core UI/k8s)

## Quick Start
```bash
# Clone & install
git clone https://github.com/openshift/console.git && cd console
make install          # yarn + go deps

# Development server
make start

# Core commands
make lint             # ESLint + Prettier
make test             # Jest unit + Cypress E2E
make build            # Production build
```

### Frontend Development Commands
- **Build**: `cd frontend && yarn build`
- **Dev server**: `cd frontend && yarn dev`
- **Run tests**: `cd frontend && yarn test`
- **Lint code**: `cd frontend && yarn lint`
- **Update i18n keys**: `cd frontend && yarn i18n`

### Backend Development Commands
- **Build**: `./build-backend.sh`
- **Tests**: `./test-backend.sh`

## Global Practices

### Commit Strategy
- **Backend dependency updates**: Separate vendor folder changes into their own commit to isolate core logic changes
- **Frontend i18n updates**: Run `yarn i18n` and commit updated keys alongside any code changes that affect i18n
- **Redux migration**: When possible during story work, migrate away from Redux/Immutable.js to React hooks/Context without increasing scope

### Branch Naming
- Feature work: `CONSOLE-####` (Jira story number)
- Bug fixes: `OCPBUGS-####` (Jira bug number)
- Base branch: `main`

## Required Reference Files for AI Coding Agents

**REQUIRED FOR ALL CODING AGENTS: Before generating or modifying code, always consult the relevant file(s) to ensure full compliance. These files are the single source of truth for architecture, coding standards, and testing.**


- **[ARCHITECTURE.md](ARCHITECTURE.md)**
- **[CONVENTIONS.md](CONVENTIONS.md)**
- **[TESTING.md](TESTING.md)**
- **[README.md](README.md)**
- **[CONTRIBUTING.md](CONTRIBUTING.md)**
- **[STYLEGUIDE.md](STYLEGUIDE.md)**  
- **[INTERNATIONALIZATION.md](INTERNATIONALIZATION.md)** 

**Tool-specific:**
- Claude → [CLAUDE.md](CLAUDE.md) and `.claude/`  
- Cursor → `.cursor/context.md`  
- CodeRabbit → [coderabbit.yaml](coderabbit.yaml)
