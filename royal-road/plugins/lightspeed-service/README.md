# OpenShift Lightspeed Service shim

`rr_ols_shim.py` lets the stock, public OLS image
(`quay.io/openshift-lightspeed/lightspeed-service-api`) run on plain Kubernetes
with OIDC users. The Deployment in
[`royal-road/deploy/lightspeed/42-ols.yaml`](../../deploy/lightspeed/42-ols.yaml)
mounts it from a ConfigMap and runs it instead of the image's
`python runner.py`. It patches two OpenShift assumptions in
`ols.src.auth.k8s`, then runs the unmodified `runner.py`:

| Problem on plain Kubernetes | Patch |
|---|---|
| At start-up OLS reads `clusterversions.config.openshift.io/version` for the cluster ID and exits if it can't. | The cluster ID comes from `RR_CLUSTER_ID` (default `local`). Installing a ClusterVersion CRD instead is not allowed (FORK.md CRD policy). |
| OLS keys conversations by the TokenReview user UID, which must be a UUID. kube-apiserver returns no UID for OIDC (Dex) users, so every request, `/authorized` included, fails with HTTP 500. | With `RR_UID_FALLBACK=1`, an empty UID becomes `uuid5(RR_UID_NAMESPACE, username)`: stable per user, so history and per-user isolation work. |

Both patch private names. The shim raises at start-up if they are missing, and
`python rr_ols_shim.py --check` only applies the patches and exits, so it can
check a new image without a config.

| File | Purpose |
|---|---|
| `rr_ols_shim.py` | The shim. |
| `test_rr_ols_shim.py` | Unit tests against a stand-in module: `python3 -m unittest discover -s royal-road/plugins/lightspeed-service` |
| `render-configmap.sh` | Writes `royal-road/deploy/lightspeed/41-ols-shim-configmap.yaml` from the `.py` file; `--check` fails if they differ. |

CI: `.github/workflows/royal-road-lightspeed-service.yml` runs the tests, the
ConfigMap check, and `--check` inside the OLS image pinned in `42-ols.yaml`.

Both fixes are candidates for upstream PRs to openshift/lightspeed-service (a
cluster-ID fallback when ClusterVersion is absent, and a UID fallback in
`ols/src/auth/k8s.py`). Once both are merged, drop the shim.
