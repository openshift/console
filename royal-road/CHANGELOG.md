# Royal Road console fork changelog

Newest first. One entry per work package from `FORK.md`.

## WP4: Observe menu and configurable monitoring endpoints

- Part A (core patch): the in-cluster Thanos and Alertmanager proxy hosts are configurable through `--thanos-host`, `--thanos-tenancy-host`, `--thanos-tenancy-for-rules-host` and `--alertmanager-host` (`BRIDGE_THANOS_HOST` and so on). The defaults are the old hard-coded hosts. A unit test in `cmd/bridge/monitoring_test.go` checks the defaults and the overrides. The env vars are documented in `royal-road/deploy/README.md`.

## WP0: CI and image publishing

- `.github/workflows/royal-road-image.yml` builds `royal-road/Dockerfile` on pull requests and pushes to `main`. On `main` it pushes `ghcr.io/royal-road/console:<short-sha>` and `:main`.
- The bridge version string is the short commit SHA. The repository's tags date from Tectonic, so `git describe` would report a misleading `v6.0.6-…`.

## WP1: Buildable Dockerfile with public base images

- `royal-road/Dockerfile` keeps upstream's three stages on public images: `golang:1.26`, `node:22` (corepack enabled; Yarn comes from the repository's `yarnPath`), and `ubi9/ubi-minimal`.
- `royal-road/Dockerfile.dockerignore` excludes `.git`, `node_modules` and local build output. BuildKit picks it up instead of the root `.dockerignore` when building with `-f royal-road/Dockerfile`.
