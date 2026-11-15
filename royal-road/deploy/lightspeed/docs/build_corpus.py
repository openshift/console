#!/usr/bin/env python3
"""Turn the documentation sources in sources.yaml into a Markdown corpus.

Two subcommands, both run inside the pinned OLS image (Python 3.12 with
PyYAML), so the pipeline needs no extra Python image:

  plan    writes fetch.tsv: one line per upstream source (name, repo, ref,
          fallback ref, sparse path), for the git step that fetches them.
  corpus  reads the fetched upstream trees and the royal-road checkouts and
          writes corpus/<index>/<source>/<path>.md, each file with `title` and
          `url` front matter (the metadata OLS returns as referenced
          documents), plus manifest.json and SOURCES.md (licenses).

--sources is the resolved file discover.py wrote (concrete refs).

Usage:
  build_corpus.py plan   --sources resolved.yaml [--profile full|smoke] --out fetch.tsv
  build_corpus.py corpus --sources resolved.yaml [--profile full|smoke]
                         --upstream-dir DIR --fetched fetched.tsv
                         --checkout-root DIR --out DIR [--commit NAME=SHA ...]
"""

from __future__ import annotations

import argparse
import json
import posixpath
import re
import shutil
import sys
from pathlib import Path

import yaml

INDEX_ORDER = ("royal-road", "upstream")
DIR_PAGES = {"_index", "index", "readme"}


# --- selection --------------------------------------------------------------


def glob_to_regex(pattern: str) -> re.Pattern[str]:
    """fnmatch-style glob where ** spans directories and * does not."""
    out = []
    i = 0
    while i < len(pattern):
        if pattern.startswith("**/", i):
            out.append("(?:.*/)?")
            i += 3
        elif pattern.startswith("**", i):
            out.append(".*")
            i += 2
        elif pattern[i] == "*":
            out.append("[^/]*")
            i += 1
        elif pattern[i] == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(pattern[i]))
            i += 1
    return re.compile("^" + "".join(out) + "$")


def select_files(root: Path, include: list[str], exclude: list[str]) -> list[str]:
    inc = [glob_to_regex(p) for p in include]
    exc = [glob_to_regex(p) for p in exclude]
    picked = []
    for path in sorted(root.rglob("*.md")):
        if not path.is_file() or ".git" in path.parts:
            continue
        rel = path.relative_to(root).as_posix()
        if any(r.match(rel) for r in inc) and not any(r.match(rel) for r in exc):
            picked.append(rel)
    return picked


def includes_for(source: dict, profile: str) -> list[str]:
    if profile == "smoke" and "smoke" in source:
        return source["smoke"]
    return source.get("include") or ["**/*.md"]


# --- Markdown clean-up ------------------------------------------------------

FRONT_MATTER = re.compile(r"\A(?:<!--\s*\n)?---\s*\n(.*?)\n---\s*\n(?:-->\s*\n)?", re.S)
HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
SHORTCODE = re.compile(r"\{\{([<%])\s*(/?)\s*([\w.-]+)(.*?)\s*[>%]\}\}", re.S)
ARG = re.compile(r'(\w+)\s*=\s*"([^"]*)"|"([^"]*)"')
ADMONITIONS = {"note", "caution", "warning", "tip", "important", "alert", "info", "boilerplate"}


def _args(raw: str) -> tuple[dict[str, str], list[str]]:
    named, positional = {}, []
    for m in ARG.finditer(raw):
        if m.group(1):
            named[m.group(1)] = m.group(2)
        else:
            positional.append(m.group(3))
    return named, positional


def strip_hugo(text: str) -> str:
    """Replace Hugo shortcodes with the plain text they stand for."""

    def repl(m: re.Match[str]) -> str:
        closing, name, raw = m.group(2) == "/", m.group(3).lower(), m.group(4)
        named, positional = _args(raw)
        if name == "text":  # istio code block: {{< text bash >}} ... {{< /text >}}
            if closing:
                return "```"
            return "```" + (positional[0] if positional else raw.strip().split(" ")[0])
        if closing:
            return ""
        if name in ADMONITIONS:
            return f"**{name.capitalize()}:** "
        if name == "glossary_tooltip":
            return named.get("text", named.get("term_id", ""))
        if name == "feature-state":
            ver = named.get("for_k8s_version", "")
            state = named.get("state", "")
            return f"FEATURE STATE: Kubernetes {ver} [{state}]".replace("  ", " ")
        if name == "tab":
            return f"**{named.get('name', '')}**\n"
        if name in {"param", "version", "skew"}:
            return positional[0] if positional else ""
        for key in ("text", "name", "title", "url", "href", "file"):
            if key in named:
                return named[key]
        return positional[0] if positional else ""

    text = SHORTCODE.sub(repl, text)
    return HTML_COMMENT.sub("", text)


def parse(text: str) -> tuple[dict, str]:
    m = FRONT_MATTER.match(text)
    if not m:
        return {}, text
    try:
        meta = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        meta = {}
    return (meta if isinstance(meta, dict) else {}), text[m.end():]


CONTENT_INCLUDE = re.compile(r'\{\{%\s*content\s+"([^"]+)"\s*%\}\}')


def not_rendered(meta: dict) -> bool:
    """Hugo pages that never become a page of their own (included elsewhere)."""
    if meta.get("headless") is True or meta.get("draft") is True:
        return True
    for key in ("build", "_build"):
        build = meta.get(key)
        if isinstance(build, dict) and build.get("render") in ("never", False, "false"):
            return True
    return False


def inline_includes(body: str, here: Path, depth: int = 0) -> str:
    """Expand {{% content "file.md" %}} (VictoriaMetrics docs) in place."""

    def repl(m: re.Match[str]) -> str:
        target = here.parent / m.group(1)
        if depth > 3 or not target.is_file():
            return ""
        _, inc = parse(target.read_text(encoding="utf-8", errors="replace"))
        return inline_includes(inc, target, depth + 1)

    return CONTENT_INCLUDE.sub(repl, body)


def first_heading(body: str) -> str | None:
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip().strip("#").strip()
    return None


# --- links ------------------------------------------------------------------


def doc_url(source: dict, rel: str, meta: dict, commit: str) -> str:
    cfg = source["url"]
    root = source.get("root", "").strip("/")
    if cfg["type"] == "github":
        at = commit if cfg.get("at", "commit") == "commit" else source["ref"]
        path = posixpath.join(root, rel) if root else rel
        repo = source["repo"].removesuffix(".git")
        return f"{repo}/blob/{at}/{path}"
    if cfg["type"] != "site":
        raise ValueError(f"{source['name']}: unknown url type {cfg['type']!r}")
    base = cfg["base"]
    for pattern, template in (cfg.get("patterns") or {}).items():
        if glob_to_regex(pattern).match(rel):
            return base + template.format(stem=Path(rel).stem, **{k: v for k, v in meta.items() if isinstance(v, str)})
    if isinstance(meta.get("url"), str) and meta["url"].startswith("/"):
        scheme_host = re.match(r"^(https?://[^/]+)", base).group(1)
        return scheme_host + meta["url"].rstrip("/") + "/"
    stem = rel[: -len(".md")]
    parts = stem.split("/")
    if parts[-1].lower() in DIR_PAGES:
        parts = parts[:-1]
    elif isinstance(meta.get("slug"), str) and meta["slug"]:
        parts[-1] = meta["slug"]
    path = "/".join(parts)
    if cfg.get("lowercase"):
        path = path.lower()
    return base + (path + "/" if path else "")


# --- commands ---------------------------------------------------------------


def load_sources(path: Path, profile: str) -> list[dict]:
    data = yaml.safe_load(path.read_text())
    sources = data["sources"]
    for s in sources:
        if s["index"] not in INDEX_ORDER:
            sys.exit(f"{s['name']}: index must be one of {INDEX_ORDER}")
        if s["index"] == "upstream" and ("{" in s.get("ref", "{") or "discover" in s):
            sys.exit(f"{s['name']}: not resolved; run discover.py resolve first")
    if profile == "smoke":
        sources = [s for s in sources if includes_for(s, profile)]
    return sources


def cmd_plan(args: argparse.Namespace) -> None:
    lines = []
    for s in load_sources(Path(args.sources), args.profile):
        if s["index"] != "upstream":
            continue
        root = s.get("root", "").strip("/")
        lines.append("\t".join([s["name"], s["repo"], s["ref"], s.get("fallback_ref", "-"),
                                 "/" + root + "/" if root else "/"]))
    Path(args.out).write_text("\n".join(lines) + "\n")
    print(f"{len(lines)} upstream sources to fetch -> {args.out}")


def cmd_corpus(args: argparse.Namespace) -> None:
    commits = dict(c.split("=", 1) for c in args.commit)
    fetched = {}
    if args.fetched and Path(args.fetched).exists():
        for line in Path(args.fetched).read_text().splitlines():
            name, commit, ref = line.split("\t")
            fetched[name] = (commit, ref)
    out = Path(args.out)
    if out.exists():
        shutil.rmtree(out)
    manifest = {"profile": args.profile, "sources": []}
    for s in load_sources(Path(args.sources), args.profile):
        if s["index"] == "upstream":
            tree = Path(args.upstream_dir) / s["name"]
            if s["name"] not in fetched:
                sys.exit(f"{s['name']}: missing from {args.fetched}")
            commit, s["ref"] = fetched[s["name"]]
        else:
            tree = Path(args.checkout_root) / s["checkout"]
            commit = commits.get(s["name"], "")
            if not re.fullmatch(r"[0-9a-f]{40}", commit):
                sys.exit(f"{s['name']}: pass --commit {s['name']}=<sha of the checkout>")
        root = tree / s.get("root", "")
        if not root.is_dir():
            sys.exit(f"{s['name']}: {root} does not exist (fetch failed?)")
        files = select_files(root, includes_for(s, args.profile), s.get("exclude", []))
        if not files:
            sys.exit(f"{s['name']}: no files selected; check include/exclude")
        written, total = 0, 0
        for rel in files:
            meta, body = parse((root / rel).read_text(encoding="utf-8", errors="replace"))
            if s.get("hugo") and not_rendered(meta):
                continue
            if s.get("hugo"):
                body = inline_includes(body, root / rel)
                body = strip_hugo(body)
            body = re.sub(r"\n{3,}", "\n\n", body).strip()
            if len(body) < 40:  # pure includes / redirects / empty section indexes
                continue
            raw_title = meta.get("title") or first_heading(body) or Path(rel).stem
            title = f"{s['title']}: {str(raw_title).strip()}"
            url = doc_url(s, rel, meta, commit)
            front = yaml.safe_dump(
                {"title": title, "url": url, "source": s["name"], "license": s["license"]},
                sort_keys=False, allow_unicode=True, width=1000,
            )
            dest = out / s["index"] / s["name"] / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            text = f"---\n{front}---\n\n{body}\n"
            dest.write_text(text, encoding="utf-8")
            written += 1
            total += len(text.encode())
        manifest["sources"].append({
            "name": s["name"], "index": s["index"], "repo": s["repo"], "ref": s.get("ref", ""),
            "version": s.get("discovered_version", ""),
            "commit": commit, "license": s["license"], "files": written, "bytes": total,
        })
        print(f"{s['index']:>10} {s['name']:<26} {written:5d} files {total / 1e6:7.2f} MB  {commit[:12]}")
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (out / "SOURCES.md").write_text(sources_md(manifest, load_sources(Path(args.sources), args.profile)))


def sources_md(manifest: dict, sources: list[dict]) -> str:
    by_name = {s["name"]: s for s in sources}
    rows = ["# Sources of this index", "",
            "Each chunk carries the URL of the page it came from.", "",
            "| Source | Version in cluster | Repository | Ref | Commit | License | Files |",
            "|---|---|---|---|---|---|---|"]
    notes = []
    for e in manifest["sources"]:
        rows.append(f"| {e['name']} | {e['version'] or '-'} | {e['repo']} | {e['ref']} | `{e['commit'][:12]}` "
                    f"| {e['license']} | {e['files']} |")
        if by_name[e["name"]].get("attribution"):
            notes.append(f"- {e['name']}: {by_name[e['name']]['attribution']}")
    return "\n".join(rows + ["", "Attribution:", ""] + notes) + "\n"


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("plan", "corpus"):
        sp = sub.add_parser(name)
        sp.add_argument("--sources", required=True)
        sp.add_argument("--profile", choices=["full", "smoke"], default="full")
        sp.add_argument("--out", required=True)
    sub.choices["corpus"].add_argument("--upstream-dir", required=True)
    sub.choices["corpus"].add_argument("--checkout-root", required=True)
    sub.choices["corpus"].add_argument("--fetched", default="", help="fetch step output: name, commit, ref")
    sub.choices["corpus"].add_argument("--commit", action="append", default=[])
    args = p.parse_args()
    {"plan": cmd_plan, "corpus": cmd_corpus}[args.cmd](args)


if __name__ == "__main__":
    main()
