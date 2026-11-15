"""Unit tests for the documentation index tooling.

Run inside the pinned OLS image (it has PyYAML; CI does this):
  python -m unittest discover -s royal-road/deploy/lightspeed/docs
"""

import tempfile
import unittest
from pathlib import Path

import yaml

import build_corpus as bc
import discover
import embeddings as emb
import make_oci
import secret_gate

HERE = Path(__file__).resolve().parent


class Globs(unittest.TestCase):
    def test_double_star_spans_directories(self):
        r = bc.glob_to_regex("concepts/**")
        self.assertTrue(r.match("concepts/workloads/pods/_index.md"))
        self.assertFalse(r.match("tasks/concepts/x.md"))
        r = bc.glob_to_regex("**/research/**")
        self.assertTrue(r.match("apps/web/research/x.md"))
        self.assertTrue(r.match("research/x.md"))

    def test_single_star_stays_in_one_directory(self):
        r = bc.glob_to_regex("reference/kubectl/*.md")
        self.assertTrue(r.match("reference/kubectl/quick-reference.md"))
        self.assertFalse(r.match("reference/kubectl/generated/x.md"))

    def test_untracked_and_secret_paths_are_excluded(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            for rel in ("README.md", "agent-backups/x/README.md", "local/notes.md",
                        "apps/research/r.md", "apps/a/README.md"):
                (root / rel).parent.mkdir(parents=True, exist_ok=True)
                (root / rel).write_text("# t\n")
            src = next(s for s in yaml.safe_load((HERE / "sources.yaml").read_text())["sources"]
                       if s["name"] == "infrastructure")
            got = bc.select_files(root, src["include"], src["exclude"])
            self.assertEqual(got, ["README.md", "apps/a/README.md"])


class Hugo(unittest.TestCase):
    def test_shortcodes(self):
        text = ('A {{< glossary_tooltip text="Pod" term_id="pod" >}} runs.\n'
                '{{< note >}}Careful.{{< /note >}}\n'
                '{{< feature-state for_k8s_version="v1.33" state="beta" >}}\n'
                '{{< text bash >}}\n$ kubectl get pods\n{{< /text >}}\n<!-- body -->')
        out = bc.strip_hugo(text)
        self.assertIn("A Pod runs.", out)
        self.assertIn("**Note:** Careful.", out)
        self.assertIn("FEATURE STATE: Kubernetes v1.33 [beta]", out)
        self.assertIn("```bash\n$ kubectl get pods\n```", out)
        self.assertNotIn("{{", out)
        self.assertNotIn("<!--", out)

    def test_not_rendered_pages(self):
        self.assertTrue(bc.not_rendered({"headless": True}))
        self.assertTrue(bc.not_rendered({"build": {"render": "never"}}))
        self.assertFalse(bc.not_rendered({"title": "x"}))


class Urls(unittest.TestCase):
    def site(self, **url):
        return {"name": "s", "repo": "https://github.com/o/r", "ref": "main", "url": {"type": "site", **url}}

    def test_site_index_pages_map_to_directory(self):
        s = self.site(base="https://k8s/docs/")
        self.assertEqual(bc.doc_url(s, "concepts/pods/_index.md", {}, ""), "https://k8s/docs/concepts/pods/")
        self.assertEqual(bc.doc_url(s, "concepts/a.md", {}, ""), "https://k8s/docs/concepts/a/")
        self.assertEqual(bc.doc_url(s, "x/README.md", {}, ""), "https://k8s/docs/x/")

    def test_lowercase_slug_and_patterns(self):
        s = self.site(base="https://vm/", lowercase=True)
        self.assertEqual(bc.doc_url(s, "victoriametrics/MetricsQL.md", {}, ""), "https://vm/victoriametrics/metricsql/")
        s = self.site(base="https://k8s/docs/", patterns={"reference/glossary/*.md": "reference/glossary/?all=true#term-{id}"})
        self.assertEqual(bc.doc_url(s, "reference/glossary/pod.md", {"id": "pod"}, ""),
                         "https://k8s/docs/reference/glossary/?all=true#term-pod")

    def test_github_at_commit_or_ref(self):
        s = {"name": "s", "repo": "https://github.com/o/r", "ref": "main", "root": "docs",
             "url": {"type": "github", "at": "commit"}}
        self.assertEqual(bc.doc_url(s, "a.md", {}, "abc"), "https://github.com/o/r/blob/abc/docs/a.md")
        s["url"]["at"] = "ref"
        self.assertEqual(bc.doc_url(s, "a.md", {}, "abc"), "https://github.com/o/r/blob/main/docs/a.md")


class Discovery(unittest.TestCase):
    def test_image_tag(self):
        self.assertEqual(discover.image_tag("docker.io/rook/ceph:v1.20.3@sha256:abc"), "v1.20.3")
        self.assertEqual(discover.image_tag("registry:5000/x/y:1.2.3"), "1.2.3")
        self.assertEqual(discover.image_tag("registry:5000/x/y"), "")

    def test_render_templates(self):
        src = {"name": "rook", "discover": [{}], "ref": "v{version}", "fallback_ref": "release-{major}.{minor}",
               "title": "Rook v{major}.{minor}", "url": {"type": "site", "base": "https://rook.io/docs/rook/v{major}.{minor}/"}}
        r = discover.render(src, "v1.21.2")
        self.assertEqual((r["ref"], r["fallback_ref"], r["title"]), ("v1.21.2", "release-1.21", "Rook v1.21"))
        self.assertEqual(r["url"]["base"], "https://rook.io/docs/rook/v1.21/")
        self.assertNotIn("discover", r)
        vm = discover.render({"name": "vm", "ref": "v{major}.{minor}.{patch}"}, "v1.156.0-cluster")
        self.assertEqual(vm["ref"], "v1.156.0")

    def test_every_upstream_source_renders(self):
        for s in yaml.safe_load((HERE / "sources.yaml").read_text())["sources"]:
            if s["index"] == "upstream":
                r = discover.render(s, "v1.2.3")
                self.assertNotIn("{", r["ref"] + r.get("root", "") + r["title"] + r["url"].get("base", ""), s["name"])

    def test_placeholders_are_skipped(self):
        self.assertTrue(discover.is_placeholder("<victorialogs-namespace>"))
        self.assertFalse(discover.is_placeholder("rook-ceph"))

    def test_rbac_file_is_generated_from_sources(self):
        import contextlib
        import io

        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            discover.cmd_rbac(type("A", (), {"sources": str(HERE / "sources.yaml"),
                                             "service_account": "lightspeed-docs-discovery",
                                             "namespace": "lightspeed-docs"})())
        self.assertEqual(buf.getvalue(), (HERE / "tekton/15-discovery-rbac.yaml").read_text(),
                         "run: discover.py rbac --sources sources.yaml > tekton/15-discovery-rbac.yaml")


class Oci(unittest.TestCase):
    def build(self, src, out):
        import subprocess
        import sys

        subprocess.run([sys.executable, str(HERE / "make_oci.py"), src, out, "--label", "a=b"],
                       check=True, capture_output=True)
        import json

        return json.loads((Path(out) / "index.json").read_text())["manifests"][0]["digest"]

    def test_layout_is_reproducible_and_complete(self):
        import gzip
        import io
        import json
        import os
        import tarfile

        with tempfile.TemporaryDirectory() as d:
            src = Path(d, "src")
            (src / "royal-road").mkdir(parents=True)
            (src / "royal-road" / "docstore.json").write_text("{}")
            (src / "manifest.json").write_text("{}")
            first = self.build(str(src), f"{d}/a")
            os.utime(src / "manifest.json", (0, 12345))  # mtimes must not matter
            self.assertEqual(first, self.build(str(src), f"{d}/b"))
            blobs = Path(d, "a", "blobs", "sha256")
            manifest = json.loads((blobs / first.split(":")[1]).read_text())
            layer = (blobs / manifest["layers"][0]["digest"].split(":")[1]).read_bytes()
            with tarfile.open(fileobj=io.BytesIO(gzip.decompress(layer))) as t:
                names = t.getnames()
                self.assertTrue(all(m.uid == 0 and m.mtime == 0 for m in t.getmembers()))
            self.assertEqual(names, ["manifest.json", "royal-road", "royal-road/docstore.json"])
            config = json.loads((blobs / manifest["config"]["digest"].split(":")[1]).read_text())
            self.assertEqual(config["config"]["Labels"], {"a": "b"})


class SecretGate(unittest.TestCase):
    def rules(self, text):
        return {rule for _, rule in secret_gate.scan(text)}

    def test_finds_credentials(self):
        self.assertIn("private-key", self.rules("-----BEGIN OPENSSH PRIVATE KEY-----"))
        self.assertIn("aws-access-key-id", self.rules("key AKIAABCDEFGHIJKLMNOP here"))
        self.assertIn("openai-style-key", self.rules("OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwx"))
        self.assertIn("github-token", self.rules("token ghp_" + "a" * 36))
        self.assertIn("assigned-secret", self.rules("password: hunter2hunter2"))
        self.assertIn("url-credentials", self.rules("postgres://app:s3cretpass@db.example:5432/x"))
        self.assertIn("bearer-token", self.rules("Authorization: Bearer abcdefghijklmnopqrstuvwxyz0123"))

    def test_ignores_placeholders_and_paths(self):
        for text in ("password: <password>", "password=$PG_PASSWORD", "password: ${PASSWORD}",
                     "--from-file=password=/dev/stdin", "api_key: REPLACE_ME", "password: changeme",
                     "Authorization: Bearer $TOKEN", "secretName: my-secret", "password: {{ .Values.pw }}"):
            self.assertEqual(self.rules(text), set(), text)


class Embeddings(unittest.TestCase):
    @staticmethod
    def fake(texts):
        """Deterministic 768-d vectors from the text (stand-in for a model)."""
        import hashlib
        out = []
        for t in texts:
            h = hashlib.sha256(t.encode()).digest()
            out.append([((h[i % 32] + i) % 97) - 48.0 for i in range(emb.DIMENSION)])
        return out

    class Remote:
        def __init__(self, fn):
            self.fn = fn

        def embed(self, texts):
            return [emb.normalise(v) for v in self.fn(texts)]

    def texts(self, n=60):
        return [f"chunk {i} " + "x" * (i % 17) for i in range(n)]

    def test_sample_is_deterministic_and_includes_long_chunks(self):
        texts = self.texts(500)
        a, b = emb.sample_texts(texts, 200), emb.sample_texts(list(texts), 200)
        self.assertEqual(a, b)
        self.assertEqual(len(set(a)), 200)
        longest = max(range(len(texts)), key=lambda i: len(texts[i]))
        self.assertIn(longest, a)

    def test_gate_passes_identical_vectors(self):
        r = emb.parity_gate(self.fake, self.Remote(self.fake), self.texts(), size=50)
        self.assertTrue(r["passed"])
        self.assertAlmostEqual(r["min_cos"], 1.0, places=6)

    def test_gate_fails_on_drift(self):
        def drift(texts):
            return [[x + (7.0 if i % 3 == 0 else 0.0) for i, x in enumerate(v)] for v in self.fake(texts)]
        r = emb.parity_gate(self.fake, self.Remote(drift), self.texts(), size=50)
        self.assertFalse(r["passed"])
        self.assertLess(r["min_cos"], 0.999)

    def test_remote_retries_then_succeeds(self):
        import http.server
        import json as j
        import threading

        calls = []

        class H(http.server.BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_POST(self):
                body = j.loads(self.rfile.read(int(self.headers["Content-Length"])))
                calls.append(self.headers["Authorization"])
                if len(calls) == 1:
                    self.send_response(503)
                    self.end_headers()
                    return
                data = [{"index": i, "embedding": [1.0] + [0.0] * (emb.DIMENSION - 1)} for i, _ in enumerate(body["input"])]
                out = j.dumps({"data": data}).encode()
                self.send_response(200)
                self.send_header("Content-Length", str(len(out)))
                self.end_headers()
                self.wfile.write(out)

        srv = http.server.HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            r = emb.RemoteEmbedder(f"http://127.0.0.1:{srv.server_port}/v1", "m", "k", batch_size=2, concurrency=1)
            emb.time.sleep, real = (lambda s: None), emb.time.sleep
            try:
                vs = r.embed(["a", "b", "c"])
            finally:
                emb.time.sleep = real
            self.assertEqual(len(vs), 3)
            self.assertEqual(r.stats["retries"], 1)
            self.assertTrue(all(c == "Bearer k" for c in calls))
        finally:
            srv.shutdown()

    def test_remote_rejects_wrong_dimension(self):
        r = emb.RemoteEmbedder("http://unused/v1", "m", "k")
        r._post = lambda texts: (_ for _ in ()).throw(emb.RemoteError("bad response"))
        with self.assertRaises(emb.RemoteError):
            r.embed(["a"])


if __name__ == "__main__":
    unittest.main()
