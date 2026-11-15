# web-terminal-routing

An external DevWorkspaceRouting solver that lets the console's web terminal run
on plain Kubernetes. Deployment and the rest of the setup:
[`royal-road/deploy/web-terminal/`](../deploy/web-terminal/README.md).

## Why it exists

The console creates each terminal as a DevWorkspace with a `routingClass`. The
DevWorkspace Operator serves the class the console uses upstream
(`web-terminal`) with its cluster-TLS solver, and only on OpenShift:

- on Kubernetes it fails the routing with "routing class web-terminal only
  supported on OpenShift";
- the solver gets the workspace's serving certificate from the OpenShift
  service CA (`service.beta.openshift.io/serving-cert-secret-name`).

Both the console bridge (it proxies only to an `https` workspace URL) and
web-terminal-exec (it always serves TLS from `/var/serving-cert/`) need that
certificate.

The operator ignores routing classes it doesn't know, so an external
controller can serve one. This one serves `web-terminal-k8s` (set with
`--routing-class`; the console sends it when the bridge runs with
`BRIDGE_WEB_TERMINAL_ROUTING_CLASS=web-terminal-k8s`).

## What it does

For each DevWorkspaceRouting with its class, the same objects as the
operator's cluster-TLS solver, with cert-manager in place of the service CA:

1. A `ClusterIP` Service `<workspace-id>-service` selecting the workspace pod,
   one port per exposed endpoint.
2. A cert-manager `Certificate` for `<service>.<namespace>.svc`, issued by
   `--issuer-name` / `--issuer-kind`, into a Secret of the same name.
3. Once the certificate is `Ready`: the routing status `Ready`, with a volume
   that mounts the Secret at `/var/serving-cert/` and the endpoint URLs
   `https://<service>.<namespace>.svc:<port>`. Until then the status is
   `Preparing`; the operator would fail a workspace whose pod keeps hitting
   `FailedMount`.
4. An owner reference on the Secret (cert-manager only sets one with
   `--enable-certificate-owner-ref`), so deleting the terminal deletes it.

The Service and Certificate are owned by the routing object and applied with
server-side apply on every change, which also reverts edits to them. A
stopped workspace gets status `Stopped`.

## Develop

```sh
go test ./...
go run . --kubeconfig /tmp/kind-<cluster>.kubeconfig
docker build -t web-terminal-routing .
```

CI: `.github/workflows/royal-road-web-terminal-routing.yml` tests and builds
on PRs and pushes `ghcr.io/royal-road/web-terminal-routing:<short-sha>` and
`:main` from `main`.
