"""Astro/Starlight MDX (developers.cloudflare.com) -> plain Markdown for the index.

The page text is kept; site machinery is turned into what a reader would see:

  import ... from "...";                    removed
  <Render file="x" product="p" />           the partial partials/p/x.mdx, inlined
  <APIRequest path=.. method=.. json={..}/> a code block: METHOD https://api.cloudflare.com/client/v4/path + body
  <Tabs>/<Steps>/<Example> ...              tags removed, content kept
  <TabItem label="API">, <Details header=X> "**API**", "**X**" before the content
  <GlossaryTooltip term=..>text</..>        text
  <Type text="x"/>, <RuleID id="x"/>        x
  <DashButton/>, <Badge/>, other self-closing components   removed
  :::note / :::caution[Warning] ... :::     "**Note:**" / "**Warning:**"
  {/* comments */}, {" "}, {props.x ...}    removed / " " / removed
  ](/path)                                  ](https://developers.cloudflare.com/path)

Components start with a capital and contain a lowercase letter (<Render>,
<APIRequest>); ALL_CAPS placeholders such as <ZONE_ID> are text and stay. Fenced code blocks are left untouched.
"""

from __future__ import annotations

import re
from pathlib import Path

# only the import block at the top of a page; imports inside code stay
IMPORTS = re.compile(r"\A(?:\s*import\s[\s\S]*?\sfrom\s+['\"][^'\"]+['\"];?[ \t]*\n)+")
FENCE = re.compile(r"^(\s*)(```|~~~)")
ADMONITION = re.compile(r"^(\s*):::(\w+)(?:\[([^\]]*)\])?\s*$")
ADMONITION_END = re.compile(r"^\s*:::\s*$")
COMMENT = re.compile(r"\{/\*[\s\S]*?\*/\}")
ATTR = re.compile(r"""(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})""")
LINK = re.compile(r"\]\((/[^)\s]*)\)")
FRONT = re.compile(r"\A---\s*\n.*?\n---\s*\n", re.S)

TEXT_ATTR = {"Type": "text", "RuleID": "id", "Badge": None, "InlineBadge": None, "Code": "code"}


def _scan_tag(text: str, start: int) -> tuple[int, str, str, bool, bool]:
    """Parse a JSX tag at text[start] == '<'. Returns (end, name, attrs, closing, selfclosing).
    Brace- and quote-aware, so json={{ "a": "b/>" }} doesn't end the tag."""
    i = start + 1
    closing = text.startswith("/", i)
    if closing:
        i += 1
    m = re.match(r"[A-Za-z][\w.]*", text[i:])
    name = m.group(0)
    i += len(name)
    depth, quote, attr_start = 0, None, i
    while i < len(text):
        c = text[i]
        if quote:
            if c == "\\":
                i += 1
            elif c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        elif depth == 0 and c == ">":
            self_closing = text[i - 1] == "/"
            attrs = text[attr_start:i - 1 if self_closing else i]
            return i + 1, name, attrs, closing, self_closing
        i += 1
    return len(text), name, text[attr_start:], closing, True


def _attrs(raw: str) -> dict[str, str]:
    out = {}
    for m in ATTR.finditer(raw):
        out[m.group(1)] = next(v for v in m.groups()[1:] if v is not None)
    return out


def _brace_value(raw: str, key: str) -> str | None:
    """Raw text of key={...} (balanced braces), e.g. the json of an APIRequest."""
    m = re.search(rf"\b{key}\s*=\s*\{{", raw)
    if not m:
        return None
    i, depth = m.end(), 1
    while i < len(raw) and depth:
        depth += {"{": 1, "}": -1}.get(raw[i], 0)
        i += 1
    inner = raw[m.end():i - 1].strip()
    return inner[1:-1].strip() if inner.startswith("{") and inner.endswith("}") else inner


class Converter:
    def __init__(self, partials: Path | None, site: str, api_base: str = "https://api.cloudflare.com/client/v4"):
        self.partials, self.site, self.api_base = partials, site.rstrip("/"), api_base

    def page(self, body: str, product: str, depth: int = 0) -> str:
        body = COMMENT.sub("", IMPORTS.sub("", body, count=1))
        out, in_fence = [], None
        lines = body.split("\n")
        prose: list[str] = []

        def flush():
            if prose:
                out.append(self._components("\n".join(prose), product, depth))
                prose.clear()

        for line in lines:
            m = FENCE.match(line)
            if in_fence:
                out.append(line)
                if m and m.group(2) == in_fence:
                    in_fence = None
                continue
            if m:
                flush()
                in_fence = m.group(2)
                out.append(line)
                continue
            a = ADMONITION.match(line)
            if a:
                label = a.group(3) or a.group(2).capitalize()
                prose.append(f"{a.group(1)}**{label}:**")
                continue
            if ADMONITION_END.match(line):
                prose.append("")
                continue
            prose.append(line)
        flush()
        text = "\n".join(out)
        text = text.replace('{" "}', " ").replace("{' '}", " ")
        text = re.sub(r"\{props\.[^{}]*\}", "", text)
        text = LINK.sub(lambda m: f"]({self.site}{m.group(1)})", text)
        return re.sub(r"\n{3,}", "\n\n", text)

    def _components(self, text: str, product: str, depth: int) -> str:
        out, i = [], 0
        while True:
            j = text.find("<", i)
            if j < 0:
                out.append(text[i:])
                break
            m = re.match(r"</?([A-Z][A-Za-z0-9.]*)(?=[\s/>])", text[j:])
            if not m or not re.search(r"[a-z]", m.group(1)):  # <ZONE_ID> is a placeholder
                out.append(text[i:j + 1])
                i = j + 1
                continue
            out.append(text[i:j])
            end, name, raw, closing, self_closing = _scan_tag(text, j)
            i = end
            if closing:
                continue
            attrs = _attrs(raw)
            if name == "Render":
                out.append(self._partial(attrs.get("file", ""), attrs.get("product", product), depth))
            elif name == "APIRequest":
                body = _brace_value(raw, "json")
                req = f"{attrs.get('method', 'GET')} {self.api_base}{attrs.get('path', '')}"
                out.append("\n```\n" + req + ("\n" + body if body else "") + "\n```\n")
            elif name == "TabItem" and attrs.get("label"):
                out.append(f"\n**{attrs['label']}**\n")
            elif name == "Details" and attrs.get("header"):
                out.append(f"\n**{attrs['header']}**\n")
            elif name in TEXT_ATTR:
                key = TEXT_ATTR[name]
                if key and attrs.get(key):
                    out.append(attrs[key])
            # every other component: tag dropped, children (if any) kept
        return "".join(out)

    def _partial(self, file: str, product: str, depth: int) -> str:
        if not self.partials or depth > 3 or not file:
            return ""
        path = self.partials / product / (file if file.endswith((".mdx", ".md")) else file + ".mdx")
        if not path.is_file():
            return ""
        body = FRONT.sub("", path.read_text(encoding="utf-8", errors="replace"), count=1)
        return "\n" + self.page(body, product, depth + 1) + "\n"


def title_from(meta: dict) -> str | None:
    """Starlight pages often have a short sidebar `title` and the real one in head."""
    for h in meta.get("head") or []:
        if isinstance(h, dict) and h.get("tag") == "title" and h.get("content"):
            return str(h["content"])
    return meta.get("title")
