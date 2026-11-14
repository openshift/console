# lightspeed-console-plugin build

Builds [openshift/lightspeed-console](https://github.com/openshift/lightspeed-console), the OpenShift Lightspeed chat plugin, for the Royal Road console. It adds the Lightspeed button and chat panel; the answers come from OLS (see [`royal-road/deploy/lightspeed/`](../../deploy/lightspeed/README.md)).

| File | Purpose |
|---|---|
| `upstream.env` | Upstream repository, branch and pinned commit. |
| `patches/*.patch` | Our changes, applied in order with `git apply`. None so far. |
| `Dockerfile` | Fetches the pinned commit, applies the patches, builds, and serves `dist/` with nginx on plain HTTP 8080. |

CI: `.github/workflows/royal-road-lightspeed-plugin.yml` builds on pull requests that touch this directory, and on `main` pushes `ghcr.io/royal-road/lightspeed-console-plugin:<short-sha>` and `:main`.

Local build (context is this directory):

```sh
docker build -t lightspeed-console-plugin royal-road/plugins/lightspeed-console-plugin
```

## Why we build it

- Upstream has no release tags. The only current image is Red Hat's Konflux build, `quay.io/redhat-user-workloads/crt-nshift-lightspeed-tenant/ols/lightspeed-console:latest`, which is rebuilt from pull-request commits too (the November 2026 build came from `52b73a8`, a commit that is not on `main`). `quay.io/openshift-lightspeed/lightspeed-console-plugin:latest` is stale (February 2026). Product images are on `registry.redhat.io`, which needs credentials.
- Upstream's image bundles three builds (PatternFly 5, console 4.19, `main`) and picks one from `OCP_VERSION` at start-up. We only need `main`.

## Upstream ref

`main`. It declares `@console/pluginAPI >=4.22.0-0` and is built against dynamic-plugin-sdk 4.22, and upstream's own image serves it for console 5.0. The `release-4.19` and `pattern-fly-5` branches are for older consoles.

To bump:

1. Set `UPSTREAM_COMMIT` to the new tip (`git ls-remote https://github.com/openshift/lightspeed-console refs/heads/main`).
2. Build. `git apply` fails loudly if a patch no longer applies.
3. Re-run the kind check in [`royal-road/deploy/lightspeed/README.md`](../../deploy/lightspeed/README.md#verified-on-kind).

## Notes

- The plugin name must stay `lightspeed-console-plugin`: its API path `/api/proxy/plugin/lightspeed-console-plugin/ols` is hard-coded (`src/config.ts`).
- Branding is unchanged ("Red Hat OpenShift Lightspeed", "email the Red Hat team"). Changing it needs a patch; nothing on this cluster depends on it.
