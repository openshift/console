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

### Type Safety
- Use specific Kubernetes resource types instead of generic `K8sResourceCommon` when you need resource-specific properties (if you only need basic properties, `K8sResourceCommon` is reasonable)
- Avoid excessive use of `any` types
- Avoid type assertions with `as` unless really needed (usually indicates a problem with types somewhere)
- Use optional chaining for safe property access where fallback behavior makes sense
- Initialize with proper defaults instead of repeated null checks where appropriate

