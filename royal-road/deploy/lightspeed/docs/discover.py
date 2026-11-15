#!/usr/bin/env python3
"""Find the versions the cluster runs and turn sources.yaml into concrete refs.

Runs in the OLS image (Python, PyYAML, the kubernetes client) with a
read-only ServiceAccount. For every upstream source it reads the version from
the live cluster (the Kubernetes /version endpoint, or the image tag of a named
Deployment/StatefulSet/DaemonSet container), fills the source's templates
({version}, {major}, {minor}, {patch}) and writes the resolved sources file the
index Task reads. A source whose workload is absent (or whose `discover`
entries are placeholders like <namespace>) is left out: the cluster doesn't run
it, so its docs aren't needed.

It then computes the index fingerprint: a hash of the resolved upstream sources
(so of every discovered version), the selected Royal Road Markdown (file names
and contents, so only doc changes count), the profile, and the build tooling.
The image tag is fp-<first 20 hex digits>; an index with that tag is complete
for that state of the cluster and the docs.

  discover.py resolve --sources S --checkout-root DIR --tools DIR [--profile P]
                      --out resolved.yaml [--results DIR]
  discover.py rbac    --sources S [--service-account NAME --namespace NS]
                      prints the ServiceAccount and the ClusterRole that lets it
                      read exactly the workloads the mapping names (get, by
                      resourceName)
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_corpus import includes_for, select_files  # noqa: E402

TOOL_FILES = ("build_corpus.py", "build_index.py", "embeddings.py", "secret_gate.py", "discover.py", "make_oci.py",
              "mdx.py")
DEFAULT_VERSION_RE = r"^v?(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)"
KINDS = {"Deployment": "deployments", "StatefulSet": "statefulsets", "DaemonSet": "daemonsets"}
TEMPLATED = ("ref", "fallback_ref", "root", "title")


def is_placeholder(value: str) -> bool:
    return "<" in str(value) or ">" in str(value)


def image_tag(image: str) -> str:
    """docker.io/rook/ceph:v1.20.3@sha256:... -> v1.20.3"""
    name = image.split("@", 1)[0]
    last = name.rsplit("/", 1)[-1]
    return last.split(":", 1)[1] if ":" in last else ""


class Cluster:
    def __init__(self) -> None:
        from kubernetes import client, config  # noqa: PLC0415

        try:
            config.load_incluster_config()
        except config.ConfigException:
            config.load_kube_config()
        self.client = client
        self.apps = client.AppsV1Api()

    def kubernetes_version(self) -> str:
        return self.client.VersionApi().get_code().git_version

    def workload_image(self, ref: dict) -> str | None:
        read = {
            "Deployment": self.apps.read_namespaced_deployment,
            "StatefulSet": self.apps.read_namespaced_stateful_set,
            "DaemonSet": self.apps.read_namespaced_daemon_set,
        }[ref["kind"]]
        try:
            obj = read(ref["name"], ref["namespace"])
        except self.client.ApiException as e:
            if e.status == 404:
                return None
            raise SystemExit(f"cannot read {ref['kind']} {ref['namespace']}/{ref['name']}: "
                             f"HTTP {e.status} (is discovery RBAC up to date? discover.py rbac)") from e
        containers = obj.spec.template.spec.containers
        for c in containers:
            if ref.get("container") in (None, c.name):
                return c.image
        return None


def week_start(now: datetime | None = None) -> datetime:
    """Monday 00:00 UTC of the current ISO week."""
    now = now or datetime.now(timezone.utc)
    return (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)


def weekly_commit(repo_url: str, branch: str, now: datetime | None = None) -> tuple[str, str, str]:
    """For unversioned docs: the last commit on `branch` before this week's
    Monday 00:00 UTC. Returns (version YYYY.WW.0, commit, description), so the
    fingerprint changes at most once a week and every build of a week fetches
    the same commit."""
    start = week_start(now)
    owner_repo = re.sub(r"^https://github\.com/|\.git$", "", repo_url)
    url = (f"https://api.github.com/repos/{owner_repo}/commits?sha={branch}"
           f"&until={start.strftime('%Y-%m-%dT%H:%M:%SZ')}&per_page=1")
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json",
                                               "User-Agent": "lightspeed-docs-discover"})
    with urllib.request.urlopen(req, timeout=30) as r:
        sha = json.load(r)[0]["sha"]
    year, week, _ = start.isocalendar()
    return f"{year}.{week}.0", sha, f"{branch} @ {sha[:12]}, last commit before {start:%Y-%m-%d}"


def discover_version(cluster: Cluster, source: dict) -> tuple[str, str, dict] | None:
    """(version string, where it came from, extra template fields), or None if
    not running here."""
    for ref in source.get("discover", []):
        if ref.get("kubernetes") == "version":
            return cluster.kubernetes_version(), "/version", {}
        if ref.get("weekly_commit"):
            version, sha, where = weekly_commit(source["repo"], ref["weekly_commit"])
            return version, where, {"commit": sha}
        if any(is_placeholder(ref.get(k, "")) for k in ("namespace", "name")):
            continue
        image = cluster.workload_image(ref)
        if image:
            return image_tag(image), f"{ref['kind']} {ref['namespace']}/{ref['name']} {image.split('@')[0]}", {}
    return None


def render(source: dict, version: str, extra: dict | None = None) -> dict:
    m = re.match(source.get("version_regex", DEFAULT_VERSION_RE), version)
    if not m:
        raise SystemExit(f"{source['name']}: version {version!r} does not match {source.get('version_regex', DEFAULT_VERSION_RE)}")
    fields = {"version": version.lstrip("v"), **m.groupdict(), **(extra or {})}
    out = copy.deepcopy(source)
    out.pop("discover", None)
    out["discovered_version"] = fields["version"]
    for key in TEMPLATED:
        if key in out:
            out[key] = str(out[key]).format(**fields)
    if "url" in out and "base" in out["url"]:
        out["url"]["base"] = out["url"]["base"].format(**fields)
    return out


def tree_hash(root: Path, files: list[str]) -> str:
    h = hashlib.sha256()
    for rel in files:
        h.update(rel.encode() + b"\0")
        h.update(hashlib.sha256((root / rel).read_bytes()).digest())
    return h.hexdigest()


def cmd_resolve(args: argparse.Namespace) -> None:
    data = yaml.safe_load(Path(args.sources).read_text())
    cluster = Cluster()
    resolved, versions, docs = [], {}, {}
    for s in data["sources"]:
        if args.profile == "smoke" and not includes_for(s, "smoke"):
            continue
        if s["index"] == "royal-road":
            root = Path(args.checkout_root) / s["checkout"] / s.get("root", "")
            files = select_files(root, includes_for(s, args.profile), s.get("exclude", []))
            docs[s["name"]] = tree_hash(root, files)
            resolved.append(s)
            print(f"{s['name']:<26} {len(files):4d} files  docs {docs[s['name']][:12]}")
            continue
        found = discover_version(cluster, s)
        if found is None:
            print(f"{s['name']:<26} not running here: skipped")
            continue
        version, where, extra = found
        r = render(s, version, extra)
        versions[s["name"]] = r["discovered_version"]
        resolved.append(r)
        print(f"{s['name']:<26} {r['discovered_version']:<12} ref {r['ref']:<16} ({where})")

    tools = hashlib.sha256()
    for name in TOOL_FILES:
        tools.update(name.encode() + b"\0" + (Path(args.tools) / name).read_bytes())
    upstream = [r for r in resolved if r["index"] == "upstream"]
    basis = {"schema": 1, "profile": args.profile, "tools": tools.hexdigest(),
             "upstream": upstream, "docs": docs}
    fingerprint = hashlib.sha256(json.dumps(basis, sort_keys=True).encode()).hexdigest()
    tag = "fp-" + fingerprint[:20]

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(yaml.safe_dump(
        {"version": 1, "fingerprint": fingerprint, "versions": versions, "docs": docs, "sources": resolved},
        sort_keys=False, width=1000))
    summary = " ".join(f"{k}={v}" for k, v in versions.items())
    print(f"fingerprint {fingerprint}\ntag {tag}\nversions {summary}")
    if args.results:
        Path(args.results, "FINGERPRINT").write_text(tag)
        Path(args.results, "VERSIONS").write_text(summary[:3500])
        # orders runs: an older discovery never rolls OLS back over a newer one
        Path(args.results, "DISCOVERED_AT").write_text(time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))


def cmd_rbac(args: argparse.Namespace) -> None:
    """One ClusterRole: get on the named workloads only (resourceNames).

    A ClusterRole rather than a Role per namespace, so nothing is created in
    the components' own namespaces and a component that isn't installed
    doesn't break the apply. It allows get on workloads of these names in any
    namespace, which reveals no more than the names already say.
    """
    data = yaml.safe_load(Path(args.sources).read_text())
    names: dict[str, set[str]] = {}
    for s in data["sources"]:
        for ref in s.get("discover", []):
            if "kind" not in ref or any(is_placeholder(ref.get(k, "")) for k in ("namespace", "name")):
                continue
            names.setdefault(KINDS[ref["kind"]], set()).add(ref["name"])
    name, labels = args.service_account, {"app.kubernetes.io/part-of": "lightspeed"}
    docs = [
        {"apiVersion": "v1", "kind": "ServiceAccount",
         "metadata": {"name": name, "namespace": args.namespace, "labels": labels}},
        {"apiVersion": "rbac.authorization.k8s.io/v1", "kind": "ClusterRole",
         "metadata": {"name": name, "labels": labels},
         "rules": [{"apiGroups": ["apps"], "resources": [res], "verbs": ["get"], "resourceNames": sorted(n)}
                   for res, n in sorted(names.items())]},
        {"apiVersion": "rbac.authorization.k8s.io/v1", "kind": "ClusterRoleBinding",
         "metadata": {"name": name, "labels": labels},
         "roleRef": {"apiGroup": "rbac.authorization.k8s.io", "kind": "ClusterRole", "name": name},
         "subjects": [{"kind": "ServiceAccount", "name": name, "namespace": args.namespace}]},
    ]
    header = ("# Generated by `discover.py rbac --sources sources.yaml`; do not edit.\n"
              "# ServiceAccount of the discover Task: get on exactly the workloads named in\n"
              "# the `discover` entries of sources.yaml (their image tags are the versions).\n"
              "# Regenerate after changing those entries. /version needs no grant.\n")
    print(header + "---\n".join(yaml.safe_dump(d, sort_keys=False) for d in docs), end="")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("resolve")
    r.add_argument("--sources", required=True)
    r.add_argument("--checkout-root", required=True)
    r.add_argument("--tools", required=True)
    r.add_argument("--profile", choices=["full", "smoke"], default="full")
    r.add_argument("--out", required=True)
    r.add_argument("--results", default="", help="Tekton results directory")
    b = sub.add_parser("rbac")
    b.add_argument("--sources", required=True)
    b.add_argument("--service-account", default="lightspeed-docs-discovery")
    b.add_argument("--namespace", default="lightspeed-docs")
    args = p.parse_args()
    {"resolve": cmd_resolve, "rbac": cmd_rbac}[args.cmd](args)


if __name__ == "__main__":
    main()
