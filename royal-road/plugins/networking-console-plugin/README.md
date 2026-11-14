# networking-console-plugin build

Builds [openshift/networking-console-plugin](https://github.com/openshift/networking-console-plugin) for the Royal Road console (FORK.md, WP3). It provides the Networking section: Services, Ingresses and NetworkPolicies, plus Routes, NetworkAttachmentDefinitions and UserDefinedNetworks when those APIs exist.

| File | Purpose |
|---|---|
| `upstream.env` | Upstream repository, branch and pinned commit. |
| `patches/*.patch` | Our changes, applied in order with `git apply`. |
| `Dockerfile` | Fetches the pinned commit, applies the patches, builds, and serves `dist/` with nginx. |

CI: `.github/workflows/royal-road-networking-plugin.yml` builds on pull requests that touch this directory, and on `main` pushes `ghcr.io/royal-road/networking-console-plugin:<short-sha>` and `:main`.

Local build (context is this directory):

```sh
docker build -t networking-console-plugin royal-road/plugins/networking-console-plugin
```

## Why we build it

No public image matches `release-5.0`:

- `quay.io/openshift/origin-networking-console-plugin` and `ghcr.io/openshift/networking-console-plugin` don't exist.
- OKD release payloads (`quay.io/okd/scos-release`) include the plugin, but only as a digest in `quay.io/okd/scos-content`. In November 2026 the newest 5.0 payload was `5.0.0-okd-scos.ec.10`. Its image is upstream commit `f1b85458` from August 2026, 48 commits behind `release-5.0`. It has no stable tag, and our patches can't be applied to it.

## Upstream ref

`release-5.0` is the branch matching the console's base. At the pinned commit it equals `release-4.23`.

To bump:

1. Set `UPSTREAM_COMMIT` to the new tip (`git ls-remote https://github.com/openshift/networking-console-plugin refs/heads/release-5.0`).
2. Build. `git apply` fails loudly if a patch no longer applies. Refresh the patch, or drop it once upstream has the fix.
3. Re-run the kind check from FORK.md WP3.

## Patches

Both are candidates for upstream PRs.

| Patch | Problem on plain Kubernetes | Change |
|---|---|---|
| `0001-hide-routes-without-route-api.patch` | The Routes nav item and pages are registered unconditionally. Without `route.openshift.io`, the Networking menu offered a Routes link to a page that couldn't list anything. | Adds a `console.flag/model` for `route.openshift.io/v1 Route` (`NETWORKING_CONSOLE_PLUGIN_ROUTE`) and requires it on every Routes extension. On OpenShift the model exists, so nothing changes there. |
| `0002-link-ingress-pages-by-gvk.patch` | Core 5.0 has no static Ingress model. The plugin's `getResourceURL` used the plain plural, so **Create Ingress** (`/k8s/ns/<ns>/ingresses/~new`) and **Edit Ingress** (`.../ingresses/<name>/yaml`) went to "404: Page Not Found". This also affects OpenShift. | Sets `crd: true` on `IngressModel`, as upstream already does for `MultiNetworkPolicyModel`, so URLs use `networking.k8s.io~v1~Ingress`. |

To write a new patch: clone upstream at `UPSTREAM_COMMIT`, `git apply` the existing patches and commit them, make your change, commit it, and export it with `git format-patch -1 --zero-commit --no-signature`.

## Serving

The runtime image is `registry.access.redhat.com/ubi9/nginx-126`: public, Red Hat's nginx build (the same nginx upstream's image installs), runs as UID 1001. Its default config serves `/opt/app-root/src` over **plain HTTP on port 8080**, so the image needs no config file. TLS isn't needed inside the cluster; see `royal-road/deploy/README.md`.
