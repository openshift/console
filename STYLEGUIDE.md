# OpenShift Console Styleguide

This document outlines the core style conventions for the OpenShift Console codebase.

## Directory and File Names

- Follow the existing naming pattern in the directory you're working in
- Directory names use lowercase dash-separated format
- Exceptions are files which have their own naming conventions (eg Dockerfile, Makefile, README)

## Go

- All go code should be formatted by gofmt
- Import statement pkgs should be separated into 3 groups: stdlib, external dependency, current project.
- TESTS: Should follow the "test tables" convention.

## SCSS/CSS

- All SCSS files are imported from the top-level file: `/frontend/public/style.scss`
- No need to import SCSS files as dependencies of others, top-level file handles this.
- When possible, avoid element selectors. Class selectors are preferred.
- Scope all classes with a recognizable prefix to avoid collisions with any imported CSS (this project uses `co-` by convention).
- Class names should be all lowercase and dash-separated.
- All SCSS variables should be scoped within their component.
- We use [BEM](http://getbem.com) naming conventions.

## TypeScript and JavaScript

- New code should be written in TypeScript, not JavaScript.
- Prefer functional components to class-based components.
- Use [React hooks](https://reactjs.org/docs/hooks-intro.html) with functional components if you need state.
- Prefer [composition to inheritance](https://reactjs.org/docs/composition-vs-inheritance.html).
- Run the linter and follow all rules defined in .eslintrc
- Never use absolute paths in code. The app should be able to run behind a proxy under an arbitrary path.
- TESTS: Should follow a similar "test tables" convention as used in Go where applicable.

### Additional OpenShift Console Specific Practices

#### React Component Patterns
- Use `React.FCC` instead of `React.FC` for components (fixes an issue with implicit 'children' in React.FC)

#### Type Safety & Kubernetes Integration
- Use specific Kubernetes resource types instead of generic `K8sResourceCommon` when possible
- Avoid excessive use of `any` types
- Avoid type assertions with `as any`
- Use optional chaining for safe property access
- Initialize with proper defaults instead of repeated null checks

#### Code Organization
- Follow established directory structure patterns
- Use consistent import organization
- Maintain clear separation of concerns
