"""Embedding back ends for build_index.py: local CPU or a remote /v1/embeddings.

OLS embeds every question locally with the all-mpnet-base-v2 copy bundled in
its image (sentence-transformers: 384-token truncation, mean pooling, L2
normalisation). Document vectors made anywhere else are only usable if they
are the same vectors. So a remote server (GPUStack serving the same weights
with text-embeddings-inference) is used only after a parity gate passes:

  - a fixed sample of chunks and the queries in PARITY_QUERIES are embedded
    both locally (exactly as OLS does) and remotely;
  - every remote vector must have cosine >= min_cos with its local twin;
  - for every query, the top-k sample chunks must be identical (same chunks,
    same order) for local-query x local-docs (a CPU-built index) and
    local-query x remote-docs (what OLS will compute with a remote-built
    index).

Remote embedding: batched requests, a few in parallel, retried with backoff on
429/5xx/timeouts; responses are checked for count, dimension and finite
values, and re-normalised.
"""

from __future__ import annotations

import hashlib
import json
import math
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field

# Questions like the ones users ask, across the indexed products.
PARITY_QUERIES = [
    "What is a Pod and when should I run more than one container in it?",
    "How do I debug a pod stuck in CrashLoopBackOff?",
    "How does a Service select its endpoints?",
    "How do I mount a ConfigMap as files in a container?",
    "What are resource requests and limits?",
    "How do I drain a node for maintenance?",
    "How does the cluster resolver reference a Task in another namespace?",
    "How do I pass results between Tekton tasks?",
    "How do I trigger a PipelineRun on a push to main with Pipelines-as-Code?",
    "How do I upgrade the Rook operator safely?",
    "How do I create a Ceph block pool and storage class?",
    "How does cert-manager renew a certificate before it expires?",
    "How do I write a LogsQL query that counts errors per namespace?",
    "How do I configure vmagent relabeling?",
    "How do I restore a namespace from a Velero backup?",
    "How do I route traffic between two versions with Istio?",
    "Which Harbor project does the console pull its image from?",
    "How is the OpenShift console deployed on this cluster?",
    "Which registry does CI push images to?",
    "How do I roll back a deployment?",
]

DIMENSION = 768


def normalise(v: list[float]) -> list[float]:
    n = math.sqrt(sum(x * x for x in v))
    if not n or not math.isfinite(n):
        raise ValueError("zero or non-finite embedding")
    return [x / n for x in v]


def dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


class RemoteError(RuntimeError):
    pass


@dataclass
class RemoteEmbedder:
    """OpenAI-compatible POST {url}/embeddings."""

    url: str
    model: str
    api_key: str
    batch_size: int = 64
    concurrency: int = 4
    timeout: float = 120.0
    retries: int = 6
    stats: dict = field(default_factory=lambda: {"requests": 0, "retries": 0, "seconds": 0.0})

    def _post(self, texts: list[str]) -> list[list[float]]:
        body = json.dumps({"model": self.model, "input": texts}).encode()
        delay = 2.0
        for attempt in range(self.retries + 1):
            req = urllib.request.Request(
                self.url.rstrip("/") + "/embeddings", data=body,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"})
            try:
                self.stats["requests"] += 1
                with urllib.request.urlopen(req, timeout=self.timeout) as r:
                    data = json.load(r)["data"]
                break
            except urllib.error.HTTPError as e:
                retryable = e.code == 429 or e.code >= 500
                err = f"HTTP {e.code}"
            except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
                retryable, err = True, type(e).__name__
            if not retryable or attempt == self.retries:
                raise RemoteError(f"embeddings request failed: {err} (after {attempt + 1} attempts)")
            self.stats["retries"] += 1
            time.sleep(min(delay, 60.0))
            delay *= 2
        vectors = [d["embedding"] for d in sorted(data, key=lambda d: d["index"])]
        if len(vectors) != len(texts) or any(len(v) != DIMENSION for v in vectors):
            raise RemoteError(f"bad response: {len(vectors)} vectors for {len(texts)} inputs")
        if not all(math.isfinite(x) for v in vectors for x in v):
            raise RemoteError("bad response: non-finite values")
        return [normalise(v) for v in vectors]

    def embed(self, texts: list[str]) -> list[list[float]]:
        t0 = time.time()
        batches = [texts[i:i + self.batch_size] for i in range(0, len(texts), self.batch_size)]
        with ThreadPoolExecutor(max_workers=self.concurrency) as pool:
            out = [v for vs in pool.map(self._post, batches) for v in vs]
        self.stats["seconds"] += time.time() - t0
        return out


def sample_texts(texts: list[str], size: int) -> list[int]:
    """Deterministic sample: the 10% longest (truncation matters most there),
    then the rest by hash of the text, so the same corpus gives the same sample."""
    if len(texts) <= size:
        return list(range(len(texts)))
    by_len = sorted(range(len(texts)), key=lambda i: -len(texts[i]))
    picked = by_len[: size // 10]
    chosen = set(picked)
    rest = sorted((i for i in range(len(texts)) if i not in chosen),
                  key=lambda i: hashlib.sha256(texts[i].encode()).hexdigest())
    return picked + rest[: size - len(picked)]


def top_k(query: list[float], docs: list[list[float]], k: int) -> list[int]:
    scores = [dot(query, d) for d in docs]
    return sorted(range(len(docs)), key=lambda i: -scores[i])[:k]


def parity_gate(local_embed, remote: RemoteEmbedder, texts: list[str], size: int = 200,
                min_cos: float = 0.999, k: int = 5) -> dict:
    """Compare remote and local vectors; returns a report, report['passed'] says."""
    idx = sample_texts(texts, size)
    docs = [texts[i] for i in idx]
    t0 = time.time()
    local_docs = [normalise(v) for v in local_embed(docs)]
    local_seconds = time.time() - t0
    local_queries = [normalise(v) for v in local_embed(PARITY_QUERIES)]
    remote_docs = remote.embed(docs)
    remote_queries = remote.embed(PARITY_QUERIES)
    cos = [dot(a, b) for a, b in zip(local_docs + local_queries, remote_docs + remote_queries)]
    retrieval_mismatch = []
    for q, (ql, qr) in enumerate(zip(local_queries, remote_queries)):
        want = top_k(ql, local_docs, k)
        for name, got in (("local query x remote docs", top_k(ql, remote_docs, k)),
                          ("remote query x remote docs", top_k(qr, remote_docs, k))):
            if got != want:
                retrieval_mismatch.append({"query": PARITY_QUERIES[q], "case": name, "want": want, "got": got})
    report = {
        "sample_chunks": len(docs), "queries": len(PARITY_QUERIES), "min_cos_required": min_cos,
        "min_cos": round(min(cos), 6), "mean_cos": round(sum(cos) / len(cos), 6),
        "top_k": k, "retrieval_mismatches": retrieval_mismatch,
        "local_chunks_per_second": round(len(docs) / max(local_seconds, 1e-6), 2),
    }
    report["passed"] = min(cos) >= min_cos and not retrieval_mismatch
    return report
