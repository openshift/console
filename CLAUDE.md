# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenShift Console (codename "Bridge") is a web-based management interface for OpenShift/Kubernetes clusters. The project consists of:

- **Backend (Go)**: API server providing authentication, proxying, and additional cluster APIs
- **Frontend (TypeScript/React)**: Single-page web application with plugin architecture
- **Dynamic Plugins**: Modular frontend components for extending console functionality

## Architecture

### Backend Structure
- `cmd/bridge/` - Main console server entry point
- `cmd/downloads/` - CLI artifacts download server
- `pkg/` - Core backend packages:
  - `auth/` - Authentication and session management
  - `helm/` - Helm chart operations and proxy
  - `proxy/` - Kubernetes API proxying
  - `server/` - HTTP server configuration
  - `serverconfig/` - Configuration management

### Frontend Structure
- `frontend/public/` - Core console application
- `frontend/packages/` - Dynamic plugins and shared libraries:
  - `console-dynamic-plugin-sdk/` - Plugin development SDK
  - `console-plugin-shared/` - Shared utilities
  - `dev-console/` - Developer perspective
  - `operator-lifecycle-manager/` - OLM integration
  - Plugin packages for specific features (helm, gitops, knative, etc.)

### Key Components
- **Plugin System**: Dynamic loading of frontend modules via webpack federation
- **Perspectives**: Different views (Admin/Developer) with distinct navigation
- **Extensions**: Declarative system for adding UI components via plugins
- **Authentication**: OAuth/OIDC integration with session management
- **Proxying**: Backend proxies Kubernetes API and adds console-specific endpoints

## Common Development Commands

### Building
```bash
# Build everything (backend + frontend + demos)
./build.sh

# Build only backend
./build-backend.sh

# Build only frontend
./build-frontend.sh

# Build frontend in development mode with hot reloading
cd frontend && yarn dev
```

### Testing
```bash
# Run all tests
./test.sh

# Backend tests only
./test-backend.sh

# Frontend tests only
./test-frontend.sh

# Frontend unit tests with Jest
cd frontend && yarn test

# Cypress integration tests
cd frontend && yarn test-cypress-console
```

### Linting and Code Quality
```bash
# Frontend linting
cd frontend && yarn lint

# Frontend code formatting
cd frontend && yarn prettier-all

# Type checking (TypeScript)
cd frontend && yarn build  # Also type-checks

# Check for circular dependencies
cd frontend && yarn check-cycles
```

### Development Setup
```bash
# Install frontend dependencies
cd frontend && yarn install

# Start development server (requires running backend)
cd frontend && yarn dev

# Run console locally (requires cluster access)
source ./contrib/oc-environment.sh
./bin/bridge
```

## Development Workflow

### Frontend Development
1. Plugin system uses webpack module federation for dynamic loading
2. Extensions are declared in `console-extensions.json` files
3. Internationalization uses i18next with namespace-based organization
4. State management via Redux with TypeScript actions
5. PatternFly React components for consistent UI

### Backend Development
1. Go modules for dependency management (`go mod tidy && go mod vendor`)
2. RESTful APIs with gorilla/mux routing
3. Kubernetes client-go for cluster interactions
4. Prometheus metrics integration
5. CSRF protection and session security

### Plugin Development
- Use `console-dynamic-plugin-sdk` for type-safe extension development
- Follow declarative extension model rather than imperative hooks
- Leverage shared components from `console-plugin-shared`
- Test plugins in isolation using the SDK's test utilities

## Configuration

### Environment Variables
- `KUBECONFIG` - Kubernetes cluster configuration
- `BRIDGE_PLUGINS` - Comma-separated list of plugin endpoints for development
- `BRIDGE_K8S_AUTH_BEARER_TOKEN` - Authentication token for cluster access
- `HOT_RELOAD` - Enable/disable frontend hot reloading (default: true)

### Local Development
- Use `contrib/oc-environment.sh` for cluster connection setup
- OAuth client setup required for authentication development
- Multiple demo plugins available in `dynamic-demo-plugin/`

## Testing Considerations

### Integration Tests
- Cypress tests organized by package (console, olm, dev-console, etc.)
- Tests can run in headed or headless mode
- Accessibility testing integrated via cypress-axe
- Multi-browser support (Chrome, Firefox, Electron)

### Unit Tests
- Jest with TypeScript support
- Enzyme for React component testing
- GraphQL query testing with generated types
- Code coverage reporting available

## Important Notes

- Frontend requires Node.js >= 22 and yarn classic
- Backend requires Go >= 1.22+
- PatternFly is the primary UI component library (version 6.x)
- Bundle size optimization is critical due to large dependency tree
- Memory limits may need adjustment for builds (`NODE_OPTIONS=--max-old-space-size=4096`)