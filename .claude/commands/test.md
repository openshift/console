---
description: Run frontend tests using test-frontend.sh and backend tests using test-backend.sh .
---

Run `./test-frontend.sh` first (to generate i18n files), then run `./test-backend.sh`, and report the results from both test suites.

Note: The frontend tests must run first because they generate i18n localization files. If the backend tests run in parallel during i18n generation, the backend vendor check will detect these generated files as git changes and fail.
