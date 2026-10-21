---
name: test
description: Run tests (frontend, backend, unit, or all)
argument-hint: "[frontend|backend|unit <name>|all]"
---

# /test

Run tests based on the arguments provided:
- If `$ARGUMENTS` contains "frontend", run `./test-frontend.sh`
- If `$ARGUMENTS` contains "backend", run `./test-backend.sh`
- If `$ARGUMENTS` contains "unit", run `cd frontend && yarn test` and pass any additional arguments after "unit"
- If no arguments or `$ARGUMENTS` contains "all", run `./test-frontend.sh` first (to generate i18n files), then run `./test-backend.sh`

Note: When running all tests, the frontend tests must run first because they generate i18n localization files. If the backend tests run in parallel during i18n generation, the backend vendor check will detect these generated files as git changes and fail.

Examples:
- `/test` or `/test all` - Run all tests
- `/test frontend` - Run frontend tests only
- `/test backend` - Run backend tests only
- `/test unit` - Run Jest unit tests
- `/test unit MyComponent` - Run Jest unit tests matching "MyComponent"
- `/test frontend backend` - Run both frontend and backend tests

Report the results from the test suite(s). If any tests fail, troubleshoot the failures and fix them.
