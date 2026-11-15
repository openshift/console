#!/usr/bin/env python3
"""Build the OLS BYOK vector indexes from the corpus build_corpus.py wrote.

Runs inside the same OLS image (quay.io/openshift-lightspeed/lightspeed-service-api)
that serves the index, so llama-index, FAISS and the embedding model are
exactly the versions OLS queries with. OLS's BYOK loader
(ols/src/rag_index/index_loader.py) always embeds questions with the bundled
sentence-transformers/all-mpnet-base-v2 (768 dimensions, CPU); this script
embeds the documents with the same model.

Based on openshift/lightspeed-rag-content byok/generate_embeddings_tool.py
(Apache-2.0), with these changes:
  - one index per corpus/<index>/ directory (royal-road, upstream), each with
    its own index id;
  - title and URL come from the front matter build_corpus.py wrote; OLS returns
    them as referenced_documents (doc_title, doc_url);
  - every chunk starts with a "Source:" line (title, section, URL), so the
    model sees where a chunk is from and can cite it (OLS gives the model only
    the chunk text);
  - embeddings use the chunk text only, not file paths;
  - secret_gate.scan() runs on every chunk: a finding in a strict index fails
    the build; other indexes only report.

Output layout (the image root; OLS mounts it at /rag):
  <out>/<index>/{default__vector_store.json,docstore.json,index_store.json,...,metadata.json}
  <out>/manifest.json   sources, commits, counts, timings
  <out>/SOURCES.md      sources and licenses
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import faiss
import frontmatter
from llama_index.core import Settings, StorageContext, VectorStoreIndex
from llama_index.core.llms.utils import resolve_llm
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import Document, MetadataMode, TextNode
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.faiss import FaissVectorStore

sys.path.insert(0, str(Path(__file__).resolve().parent))
from embeddings import RemoteEmbedder, RemoteError, normalise, parity_gate  # noqa: E402
from secret_gate import scan  # noqa: E402

INDEX_ORDER = ("royal-road", "upstream")
INDEX_IDS = {"royal-road": "royal-road-docs", "upstream": "upstream-docs"}
# OLS's BYOK embedding model: ols.constants.EMBEDDINGS_MODEL_BYOK_SUBDIR,
# resolved through the image's Hugging Face cache (HF_HOME, offline).
EMBED_MODEL = "all-mpnet-base-v2"
EMBED_MODEL_ID = "sentence-transformers/all-mpnet-base-v2"


def available_cpus() -> int:
    """CPUs this container may use: the cgroup quota (the pod's CPU limit) if
    set, else the affinity mask. os.cpu_count() reports the node's CPUs, and
    torch oversubscribes badly with that many threads."""
    cpus = len(os.sched_getaffinity(0))
    try:
        quota, period = Path("/sys/fs/cgroup/cpu.max").read_text().split()
        if quota != "max":
            cpus = min(cpus, max(1, int(int(quota) / int(period))))
    except (OSError, ValueError):
        pass
    return cpus


def section_at(text: str, offset: int) -> str:
    """The last Markdown heading before offset."""
    heading = ""
    for line in text[:offset].splitlines():
        if line.startswith("#") and line.lstrip("#").startswith(" "):
            heading = line.lstrip("#").strip()
    return heading


def load_documents(index_dir: Path) -> list[Document]:
    docs = []
    for path in sorted(index_dir.rglob("*.md")):
        post = frontmatter.load(path)
        docs.append(Document(
            text=post.content,
            metadata={
                "title": post["title"],
                "docs_url": post["url"],
                "source": post.get("source", ""),
                "file_path": path.relative_to(index_dir).as_posix(),
            },
            excluded_embed_metadata_keys=["title", "docs_url", "source", "file_path"],
            excluded_llm_metadata_keys=["title", "docs_url", "source", "file_path"],
        ))
    return docs


def chunk(docs: list[Document], chunk_size: int, overlap: int) -> list[TextNode]:
    splitter = SentenceSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
    nodes = []
    by_id = {d.doc_id: d for d in docs}
    for node in splitter.get_nodes_from_documents(docs):
        doc = by_id[node.ref_doc_id]
        section = section_at(doc.text, node.start_char_idx or 0)
        where = f"{doc.metadata['title']}" + (f" > {section}" if section else "")
        node.text = f"Source: {where} <{doc.metadata['docs_url']}>\n{node.text}"
        nodes.append(node)
    return nodes


def gate(name: str, nodes: list[TextNode], strict: bool) -> int:
    hits = 0
    for node in nodes:
        for line, rule in scan(node.get_content(MetadataMode.NONE)):
            hits += 1
            print(f"  secret gate [{name}] {node.metadata['file_path']} chunk line {line}: {rule}")
    print(f"  secret gate [{name}]: {hits} finding(s) ({'strict' if strict else 'report only'})")
    if hits and strict:
        sys.exit(f"secret gate failed for index {name}: fix or remove the content above")
    return hits


def embed_all(args, texts: list[str], local: HuggingFaceEmbedding, threads: int) -> tuple[list[list[float]], dict]:
    """Vectors for every chunk text, and a report of how they were made."""
    report: dict = {"requested": args.embedder, "used": "cpu"}
    if args.embedder == "gpustack":
        key = Path(args.embeddings_key_file).read_text().strip() if Path(args.embeddings_key_file).is_file() else ""
        if not key or not args.embeddings_url:
            report["fallback_reason"] = "no embeddings URL or API key"
        else:
            remote = RemoteEmbedder(args.embeddings_url, args.embeddings_model, key,
                                    batch_size=args.remote_batch_size, concurrency=args.remote_concurrency)
            try:
                gate_report = parity_gate(local.get_text_embedding_batch, remote, texts,
                                          size=args.parity_sample, min_cos=args.parity_min_cos)
                report["parity"] = gate_report
                print(f"  parity gate: {gate_report['sample_chunks']} chunks + {gate_report['queries']} queries, "
                      f"min cos {gate_report['min_cos']} (need {args.parity_min_cos}), mean {gate_report['mean_cos']}, "
                      f"top-{gate_report['top_k']} mismatches {len(gate_report['retrieval_mismatches'])}: "
                      f"{'PASS' if gate_report['passed'] else 'FAIL'}")
                for m in gate_report["retrieval_mismatches"][:5]:
                    print(f"    mismatch [{m['case']}] {m['query']!r}: want {m['want']} got {m['got']}")
                if gate_report["passed"]:
                    t0 = time.time()
                    vectors = remote.embed(texts)
                    report.update(used="gpustack", seconds=round(time.time() - t0, 1), remote=remote.stats)
                    print(f"  embedded {len(texts)} chunks on {args.embeddings_model} in {report['seconds']}s "
                          f"({remote.stats['requests']} requests, {remote.stats['retries']} retries)")
                    return vectors, report
                report["fallback_reason"] = "parity gate failed"
                cpu_rate = gate_report["local_chunks_per_second"]
            except RemoteError as e:
                report["fallback_reason"] = str(e)
                cpu_rate = None
        print(f"  falling back to CPU: {report['fallback_reason']}")
        # Refuse a CPU build that cannot finish in time, rather than run into
        # the pipeline timeout. Rate measured on the parity sample, else probed.
        if not cpu_rate:
            probe = texts[: min(64, len(texts))]
            t0 = time.time()
            local.get_text_embedding_batch(probe)
            cpu_rate = len(probe) / max(time.time() - t0, 1e-6)
        estimate = len(texts) / cpu_rate / 60
        report["cpu_estimate_minutes"] = round(estimate, 1)
        print(f"  CPU estimate: {len(texts)} chunks at {cpu_rate:.1f}/s = {estimate:.0f} min "
              f"(budget {args.cpu_budget_minutes} min)")
        if estimate > args.cpu_budget_minutes:
            sys.exit(f"CPU fallback would take about {estimate:.0f} min, over the {args.cpu_budget_minutes} min budget; "
                     "fix the embeddings service or raise cpu-budget-minutes")
    t0 = time.time()
    print(f"  embedding {len(texts)} chunks on CPU with {threads} threads ...")
    vectors = [normalise(v) for v in local.get_text_embedding_batch(texts)]
    report.update(used="cpu", seconds=round(time.time() - t0, 1))
    print(f"  embedded on CPU in {report['seconds']}s")
    return vectors, report


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--corpus", required=True, help="build_corpus.py output directory")
    p.add_argument("--out", required=True, help="image root to write")
    p.add_argument("--chunk-size", type=int, default=320,
                   help="tokens per chunk; with the Source line this stays under the model's 384")
    p.add_argument("--chunk-overlap", type=int, default=32)
    p.add_argument("--batch-size", type=int, default=64, help="CPU embedding batch size")
    p.add_argument("--strict", action="append", default=["royal-road"],
                   help="index whose secret findings fail the build (repeatable)")
    p.add_argument("--fingerprint", default="", help="discover.py fingerprint, recorded in manifest.json")
    p.add_argument("--embedder", choices=["cpu", "gpustack"], default="cpu",
                   help="gpustack: remote /v1/embeddings after the parity gate, CPU fallback")
    p.add_argument("--embeddings-url", default="", help="OpenAI-compatible base URL, ending in /v1")
    p.add_argument("--embeddings-model", default="docs-embeddings")
    p.add_argument("--embeddings-key-file", default="", help="file holding the API key")
    p.add_argument("--remote-batch-size", type=int, default=64)
    p.add_argument("--remote-concurrency", type=int, default=4)
    p.add_argument("--parity-sample", type=int, default=200)
    p.add_argument("--parity-min-cos", type=float, default=0.999)
    p.add_argument("--cpu-budget-minutes", type=float, default=100,
                   help="fail instead of falling back to CPU if that would take longer")
    args = p.parse_args()

    started = time.time()
    corpus, out = Path(args.corpus), Path(args.out)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    threads = int(os.environ.get("EMBED_THREADS", "0")) or available_cpus()
    import torch  # noqa: PLC0415  (imported by llama-index anyway)
    torch.set_num_threads(threads)
    Settings.llm = resolve_llm(None)
    # The query-side model: the parity reference, and the CPU path.
    local = HuggingFaceEmbedding(model_name=EMBED_MODEL, embed_batch_size=args.batch_size)
    Settings.embed_model = local
    dim = len(local.get_text_embedding("dimension probe"))

    # 1. chunk and gate every index; 2. embed all chunks at once (one parity
    # gate, one remote session); 3. write each index with its vectors.
    chunked = []
    for name in INDEX_ORDER:
        index_dir = corpus / name
        if index_dir.is_dir():
            docs = load_documents(index_dir)
            nodes = chunk(docs, args.chunk_size, args.chunk_overlap)
            findings = gate(name, nodes, name in args.strict)
            print(f"  [{name}] {len(docs)} documents -> {len(nodes)} chunks")
            chunked.append((name, docs, nodes, findings))
    all_nodes = [n for _, _, nodes, _ in chunked for n in nodes]
    texts = [n.get_content(metadata_mode=MetadataMode.EMBED) for n in all_nodes]
    vectors, embed_report = embed_all(args, texts, local, threads)
    for node, vector in zip(all_nodes, vectors):
        node.embedding = vector

    manifest = json.loads((corpus / "manifest.json").read_text())
    manifest["indexes"] = []
    manifest["embeddings"] = embed_report
    for name, docs, nodes, findings in chunked:
        store = FaissVectorStore(faiss_index=faiss.IndexFlatIP(dim))
        # Nodes carry their vectors, so llama-index embeds nothing here.
        index = VectorStoreIndex(nodes, storage_context=StorageContext.from_defaults(vector_store=store),
                                 show_progress=False)
        index.set_index_id(INDEX_IDS[name])
        dest = out / name
        index.storage_context.persist(persist_dir=str(dest))
        meta = {
            "execution-time": embed_report.get("seconds"), "llm": "None", "embedding-model-name": EMBED_MODEL_ID,
            "embedded-on": embed_report["used"],
            "index-id": INDEX_IDS[name], "vector-db": "faiss.IndexFlatIP", "embedding-dimension": dim,
            "chunk": args.chunk_size, "overlap": args.chunk_overlap, "total-embedded-files": len(docs),
            "total-chunks": len(nodes), "secret-findings": findings,
        }
        (dest / "metadata.json").write_text(json.dumps(meta) + "\n")
        size = sum(f.stat().st_size for f in dest.iterdir())
        manifest["indexes"].append({"name": name, "index_id": INDEX_IDS[name], "path": f"/rag/{name}",
                                    "documents": len(docs), "chunks": len(nodes), "bytes": size})
        print(f"  [{name}] written, {size / 1e6:.1f} MB")

    manifest["fingerprint"] = args.fingerprint
    manifest["built"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    manifest["seconds"] = round(time.time() - started, 1)
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    shutil.copy(corpus / "SOURCES.md", out / "SOURCES.md")

    print(f"index image root {out}: {json.dumps(manifest['indexes'])}")
    print(f"embedded on {embed_report['used']}, fingerprint {args.fingerprint or '-'}, total {manifest['seconds']}s")


if __name__ == "__main__":
    main()
