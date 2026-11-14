"""Start OpenShift Lightspeed Service (OLS) on plain Kubernetes.

The stock lightspeed-service image runs `python runner.py`. Our Deployment runs
this file instead (mounted from a ConfigMap). It patches two OpenShift
assumptions in `ols.src.auth.k8s`, then runs the unmodified runner.py:

1. Cluster ID: at start-up OLS reads clusterversions.config.openshift.io
   `version` and exits if it can't. That API doesn't exist here, so the ID comes
   from RR_CLUSTER_ID (default "local").
2. User UID (only when RR_UID_FALLBACK=1): OLS keys conversations by the
   TokenReview user UID and requires a UUID. OIDC users on vanilla Kubernetes
   have no UID, so every request fails with HTTP 500. Derive a stable UUIDv5
   from the username instead.

Both patch private names. The image must be pinned by digest, and
`python rr_ols_shim.py --check` (run in a new image) fails if the
names are gone.
"""

import os
import runpy
import sys
import uuid

APP_ROOT = os.environ.get("RR_OLS_APP_ROOT", "/app-root")
# uuid.NAMESPACE_OID; any fixed UUID works, but changing it orphans every
# user's conversation history.
DEFAULT_UID_NAMESPACE = "6ba7b812-9dad-11d1-80b4-00c04fd430c8"


def uid_for(username: str, namespace: uuid.UUID) -> str:
    """Return the stable UUIDv5 used as the UID of a user without one."""
    return str(uuid.uuid5(namespace, username))


def patch(k8s, environ) -> None:
    """Apply both patches to the `ols.src.auth.k8s` module."""
    singleton = k8s.K8sClientSingleton
    for name in ("_cluster_id", "_cluster_version"):
        if not hasattr(singleton, name):
            raise RuntimeError(f"K8sClientSingleton.{name} not found; re-check the shim against this OLS image")
    if not callable(getattr(k8s, "get_user_info", None)):
        raise RuntimeError("ols.src.auth.k8s.get_user_info not found; re-check the shim against this OLS image")

    singleton._cluster_id = environ.get("RR_CLUSTER_ID", "local")
    singleton._cluster_version = environ.get("RR_CLUSTER_VERSION", "unknown")

    if environ.get("RR_UID_FALLBACK") != "1":
        return
    namespace = uuid.UUID(environ.get("RR_UID_NAMESPACE", DEFAULT_UID_NAMESPACE))
    original = k8s.get_user_info

    def get_user_info(token):
        review = original(token)
        if review is not None and review.user is not None and not review.user.uid:
            review.user.uid = uid_for(review.user.username, namespace)
        return review

    k8s.get_user_info = get_user_info


def main() -> None:
    sys.path.insert(0, APP_ROOT)
    os.chdir(APP_ROOT)
    from ols.src.auth import k8s  # noqa: PLC0415  (needs APP_ROOT on sys.path)

    patch(k8s, os.environ)
    if "--check" in sys.argv[1:]:
        print("rr_ols_shim: OLS internals found, patches apply")
        return
    sys.argv = [os.path.join(APP_ROOT, "runner.py")]
    runpy.run_path(sys.argv[0], run_name="__main__")


if __name__ == "__main__":
    main()
