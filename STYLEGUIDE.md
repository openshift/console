# Tectonic Console Styleguide

## Directory and File Names

- Use lowercase dash-separated names for all files (to avoid git issues with case-insensitive file systems)
- Exceptions are files which have their own naming conventions (eg Dockerfile, Makefile, README)

## Go

- All go code should be formatted by gofmt
- Import statement pkgs should be separated into 3 groups: stdlib, external dependency, current project.
- TESTS: Should follow the "test tables" convention.

## SCSS/CSS

- All SCSS files are imported from the top-level file: `/frontend/public/style.scss`
- No need to import SCSS files as dependencies of others, top-level file handles this.
- All SCSS files should be prefixed with an underscore, (eg `_my-custom-file.scss`).
- When possible, avoid element seclectors. Class selectors are preferred.
- Scope all classes with a recognizable prefix to avoid collisions with any imported CSS (this project uses `co-` by convention).
- Class names should be all lowercase and dash-separated.
- All SCSS variables should be scoped within their component.
- We use [BEM](http://getbem.com) naming conventions.

## JavaScript

- Run the linter and follow all rules defined in .eslintrc
- Prefer ES6 `const` over `let` or `var` when values do not change.
- Never use absolute paths in code. The app should be able to run behind a proxy under an arbitrary path.
- TESTS: Should follow a simliar "test tables" convention as used in Go where applicable.