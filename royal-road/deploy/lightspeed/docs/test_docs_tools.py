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
import secret_gate

HERE = Path(__file__).resolve().parent


class Globs(unittest.TestCase):
    def test_double_star_spans_directories(self):
        r = bc.glob_to_regex("concepts/**")
        self.assertTrue(r.match("concepts/workloads/pods/_index.md"))
        self.assertFalse(r.match("tasks/concepts/x.md"))
        r = bc.glob_to_regex("**/research/**")
        self.assertTrue(r.match("applications/anubis/research/x.md"))
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


if __name__ == "__main__":
    unittest.main()
