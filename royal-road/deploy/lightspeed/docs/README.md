# Lightspeed documentation (RAG)

Lightspeed answers from documentation as well as from the model and the
cluster tools: our own docs, and the upstream docs **for the versions the
cluster actually runs**. A Tekton Pipeline finds those versions in the live
cluster, builds the matching index, pushes it as an image, and moves OLS onto
it. Upgrading Kubernetes or a component needs no release of anything here:
the next daily run sees the new version and rebuilds.

```
daily CronJob ─┐                       ┌─ index exists ─────────────────────────┐
PaC push (*.md)┴─> clone ─> discover ──┤                                         ├─> rollout: patch OLS's
                    console   versions  └─ new ─> index ─> OCI layout ─> skopeo push┘   image volume, wait Ready,
                    infra     fingerprint          (OLS image)   <image>:fp-<hash>   restore the old one if not
```

Each answer that uses the docs lists them under the chat answer (OLS
`referenced_documents`), and the model cites them inline. Links go to the
upstream page for the matching version (`v1-36.docs.kubernetes.io`,
`rook.io/docs/rook/v1.21/...`, a GitHub blob at the release tag) or to our
files on GitHub (`blob/main/...`).

## How OLS uses it

OLS's "bring your own knowledge" (BYOK) support: `ols_config.reference_content`
in [`../40-ols-config.yaml`](../40-ols-config.yaml) lists two FAISS indexes
(llama-index format), mounted from the index image at `/rag`
([`../42-ols.yaml`](../42-ols.yaml), image volume `docs-index`):

| Index | Path | Content |
|---|---|---|
| `royal-road-docs` | `/rag/royal-road` | git-tracked Markdown of royal-road/infrastructure; the console fork's `FORK.md`, `royal-road/**/README.md`, `CHANGELOG.md`, `WP6-TRIAGE.md` |
| `upstream-docs` | `/rag/upstream` | upstream docs at the discovered versions (table below) |

For every question OLS embeds the text with its bundled
`sentence-transformers/all-mpnet-base-v2` (768 dimensions, CPU only), takes the
best 5 chunks over both indexes with similarity ≥ 0.3, puts them into the
prompt, and returns their `title` and `docs_url` as `referenced_documents`. It
scales the scores of every index after the first by 0.95, so on a tie our own
docs win; the system prompt also tells the model to prefer them for questions
about this cluster and to cite. OLS loads the indexes at start-up;
`/readiness` stays false until they are loaded.

The embedding model is not configurable in this OLS version (the
`embeddings_model_path` key is gone; `ols.constants.EMBEDDINGS_MODEL_BYOK_SUBDIR`).
So the index is built **inside the same OLS image** (pinned by digest in
`../42-ols.yaml` and in the Tasks): same llama-index, FAISS and model, no
mismatch possible. Upstream's BYOK tool
(`openshift/lightspeed-rag-content` `byok/`) does the same embedding but runs
nested buildah from an image on `registry.redhat.io`; `build_index.py` is
based on its `generate_embeddings_tool.py` (Apache-2.0).

### Embeddings on a GPU (GPUStack)

By default (`embedder: gpustack`) the index step sends the chunks to an
OpenAI-compatible `/v1/embeddings` that serves **the same weights** (GPUStack
model `docs-embeddings`), so a full build takes minutes instead of over an
hour. Vectors are only usable if they equal what OLS computes locally, so
`embeddings.py` gates every build:

- a fixed sample (200 chunks, the 10% longest included, plus 20 typical
  questions) is embedded both locally in the OLS image and remotely;
- every remote vector needs cosine ≥ 0.999 with its local twin, and for every
  question the top-5 chunks (same chunks, same order) must be identical for
  local question × local chunks and local question × remote chunks (what OLS
  computes with a GPU-built index), and remote × remote;
- on failure, or if the service errors after retries, the build falls back to
  CPU, unless the CPU estimate (measured on the sample) exceeds
  `cpu-budget-minutes` (default 100, the pipeline timeout is 2 h): then it
  fails. `embedder: cpu` skips the remote path entirely.

The result is recorded in `/manifest.json` of the image (`embeddings`: used,
parity report, timings).

The serving side must run sentence-transformers' math: exact GeLU, mean
pooling, L2 normalisation, 384-token truncation, fp32 without TF32. Verified
choice: **Infinity** (`michaelf34/infinity`, torch engine) started with
`--dtype float32 --no-bettertransformer --pooling-method mean` and a wrapper
that turns TF32 back off (Infinity enables it at import). Its CPU build gave
cosine 1.000000 and identical rankings against the OLS image; on the GPU the
same. **Not** Hugging Face text-embeddings-inference: it always replaces exact
GeLU with the tanh approximation (TEI PR #753); on this model that gave cosine
0.9999 but swapped near-tied top-5 results for 3 of 20 questions, so the gate
rejects it. vLLM has no MPNet support.

Each chunk starts with a line `Source: <title> > <section> <URL>`: OLS gives
the model only the chunk text, so this is how the model knows where a chunk
comes from and can cite it. Chunks are 320 tokens (+ that line), under the
model's 384-token input.

## Files

| File | What it is |
|---|---|
| `sources.yaml` | The mapping: which docs, where each component's version comes from, how a version becomes a docs ref and URL. Installed as ConfigMap `lightspeed-docs-sources`. |
| `discover.py` | Reads the versions from the cluster, renders `sources.yaml` for them, computes the fingerprint. `discover.py rbac` generates `tekton/15-discovery-rbac.yaml`. |
| `build_corpus.py` | Fetched trees → Markdown with `title`/`url` front matter; Hugo shortcodes removed; `SOURCES.md`, `manifest.json`. |
| `build_index.py` | Chunks, runs the secret gate, embeds, writes the FAISS indexes. |
| `secret_gate.py` | Credential patterns, run on every chunk. |
| `make_oci.py` | Writes the index directory as a one-layer OCI layout (no container engine, reproducible digest); skopeo pushes it. |
| `kustomization.yaml` | Everything below plus the ConfigMap: `kubectl apply --server-side -k royal-road/deploy/lightspeed/docs`. |
| `tekton/00-namespace.yaml` | Namespace `lightspeed-docs` (PSA baseline). |
| `tekton/10-rbac.yaml` | ServiceAccounts `lightspeed-docs-builder` (no API token) and `lightspeed-docs-scheduler` (create PipelineRuns here). |
| `tekton/15-discovery-rbac.yaml` | Generated. `lightspeed-docs-discovery`: `get` on the named workloads only. |
| `tekton/16-rollout-rbac.yaml` | `lightspeed-docs-rollout`: get/list/watch/patch on Deployment `openshift-lightspeed/lightspeed-app-server` only. |
| `tekton/20-task-discover.yaml` | Task: versions → fingerprint → does the image exist? |
| `tekton/21-task-index.yaml` | Task: fetch, corpus, gitleaks, index. |
| `tekton/22-task-rollout.yaml` | Task: point OLS at an index image, wait, restore on failure. |
| `tekton/30-pipeline.yaml` | Pipeline `lightspeed-docs-index`. |
| `tekton/40-schedule.yaml` | Daily CronJob creating a PipelineRun. |
| `tekton/pac/` | `.tekton/` PipelineRun and Repository for royal-road/infrastructure. |
| `tekton/examples/` | A manual PipelineRun; the shapes of the two Secrets. **Do not apply the Secret examples in production.** |
| `test/fixtures.yaml` | kind only: registry and git daemon. |
| `test_docs_tools.py` | Unit tests (CI: `.github/workflows/royal-road-lightspeed-docs.yml`, in the pinned OLS image). |

## Versions: discovery and fingerprint

Every upstream source in `sources.yaml` says where its version comes from, and
templates (`{version}`, `{major}`, `{minor}`, `{patch}`) turn it into a git ref,
a docs root, a title and a URL base:

| Source | Version from | Docs ref (example for the version found) | Links |
|---|---|---|---|
| Kubernetes | API server `/version` | kubernetes/website `release-1.36` | `v1-36.docs.kubernetes.io` |
| Tekton Pipelines | `tekton-pipelines/tekton-pipelines-controller` image tag | tektoncd/pipeline `v1.15.5` `docs/` | GitHub at the tag's commit |
| Tekton Triggers | `tekton-pipelines/tekton-triggers-controller` | tektoncd/triggers `v0.37.2` | GitHub |
| Pipelines-as-Code | `pipelines-as-code/pipelines-as-code-controller` | tektoncd/pipelines-as-code `v0.54.0` | GitHub |
| Rook | `rook-ceph/rook-ceph-operator` | rook/rook `v1.20.3` `Documentation/` | `rook.io/docs/rook/v1.20/` |
| cert-manager | `cert-manager/cert-manager` | cert-manager/website `master` (one current docs tree) | `cert-manager.io/docs/` |
| VictoriaMetrics | vmselect or vmsingle (placeholders) | VictoriaMetrics `v1.156.0` | `docs.victoriametrics.com` |
| VictoriaMetrics operator | operator Deployment (placeholders) | VictoriaMetrics/operator `v0.75.2` | `docs.victoriametrics.com/operator/` |
| VictoriaLogs | StatefulSet/Deployment (placeholders) | VictoriaMetrics/VictoriaLogs `v1.53.0` | `docs.victoriametrics.com` |
| VictoriaTraces | StatefulSet (placeholders) | VictoriaMetrics/VictoriaTraces `v0.9.4` | `docs.victoriametrics.com` |
| Velero | `velero/velero` | vmware-tanzu/velero `main`, `site/content/docs/v1.18` | `velero.io/docs/v1.18/` |
| Istio | `istio-system/istiod` | istio/istio.io `release-1.30` | `istio.io/v1.30/docs/` |

A component that isn't found (Deployment absent, or `discover` entries still
holding `<placeholders>`) is skipped: no docs for what the cluster doesn't
run. A ref that doesn't exist upstream falls back to `fallback_ref` where one
is set (e.g. the Kubernetes docs branch for a brand-new release), with a
warning in the log; otherwise the run fails.

Workload names are the upstream install defaults. Where your cluster uses
other names (Helm release names, the Victoria* stack), change the `discover`
entries in `sources.yaml` and regenerate the RBAC:

```sh
docker run --rm --entrypoint python -v "$PWD/royal-road/deploy/lightspeed/docs:/docs" -w /docs \
  quay.io/openshift-lightspeed/lightspeed-service-api@sha256:<digest from 42-ols.yaml> \
  discover.py rbac --sources sources.yaml > royal-road/deploy/lightspeed/docs/tekton/15-discovery-rbac.yaml
```

(or keep the change in the infrastructure repo as an overlay of the
ConfigMap and the ClusterRole).

The **fingerprint** is a SHA-256 over: the resolved upstream sources (every
discovered version and the refs and subsets derived from it), the selected
Royal Road Markdown (paths and contents, so a commit that touches no doc
changes nothing), the profile, and the build scripts. The image tag is
`fp-<first 20 hex digits>`. If that tag is already in the registry, the run
skips the build and only makes sure OLS uses it.

Upstream refs are tags where projects tag their docs; branch-based docs
(Kubernetes `release-1.36`, Istio `release-1.30`, cert-manager `master`,
Velero `main`) are fetched at whatever commit the branch has when a build
runs, and that commit is recorded in `/manifest.json` and `/SOURCES.md` of the
image. Branch updates alone don't trigger a rebuild.

## Image

The image holds only files (`/royal-road`, `/upstream`, `/manifest.json`,
`/SOURCES.md`), so no container engine builds it: `make_oci.py` writes a
one-layer OCI layout (files sorted, owner 0:0, mtime 0, fixed gzip header) and
`skopeo copy` pushes it, both unprivileged. Buildah was the first choice and
fails on PSA-restricted production nodes (`remount /: permission denied` when
applying the layer). The same content always gives the same digest, so two
runs that build the same fingerprint push the same image.

## Rollout

The last Task patches OLS's image volume `docs-index` to
`<image>:fp-…@sha256:…` (strategic merge, field manager `lightspeed-docs`), sets
the annotations `lightspeed-docs/previous-index` (Deployment) and
`lightspeed-docs/fingerprint` (pod template), and waits for the rollout. The
OLS pod turns Ready only after loading the indexes, so a broken index fails
the wait; the Task then patches the previous reference back and fails the
run. If OLS already uses that reference, nothing changes and nothing restarts.

Why an image volume and not a PVC with Reloader: the image is immutable and
addressed by digest, so OLS gets exactly the index that was tested by its
readiness probe, rollback is one patch to the previous digest, and nothing
has to be copied. A PVC would need RWX across namespaces (the pipeline runs
in `lightspeed-docs`) and leaves OLS reading files that the next build may be
rewriting. Image volumes are GA in Kubernetes 1.36 and need containerd ≥ 2.1
(or CRI-O ≥ 1.31).

Old indexes: keep the last N tags with a Harbor tag-retention rule on the
repository (e.g. "retain the most recently pushed 10 artifacts" for
`lightspeed-docs-index`). Roll back by patching the reference to a previous
digest (the Deployment's `lightspeed-docs/previous-index` annotation has the
last one); the next run moves OLS forward again unless the cause is fixed.

If you apply `../42-ols.yaml` with server-side apply after the pipeline has
taken over the reference, apply reports a conflict on that field instead of
silently going back; leave the field to the pipeline.

Concurrent runs (the schedule, a push, a manual run): the CronJob creates no
run while one is in progress. Each run's discover Task records its time, and
the rollout writes it to the Deployment annotation
`lightspeed-docs/discovered-at`; a run never replaces an index chosen by a
later discovery, and a rollout that another run replaced while it was waiting
fails as superseded. Two runs that discover the same fingerprint at the same
time can still both build it; the second push replaces the tag with an
equivalent image.

## Secret gate

The index is read by an LLM and stored in a registry, so the build fails if
our docs contain a credential:

- **gitleaks** (`dir` mode, v8.30.1, default rules) over the Royal Road corpus;
- **`secret_gate.py`** over every Royal Road chunk, i.e. the exact text in the
  index: private keys, AWS/GitHub/GitLab/Slack/Google/Stripe/Sentry tokens,
  `sk-…` keys, JWTs, bearer tokens, credentials in URLs, kubeconfig key data,
  and `password=`/`api_key:`/`client_secret:`… assignments whose value is not
  a placeholder (`<…>`, `$VAR`, `{{ … }}`, a file path, `changeme`, ALL_CAPS…).

Upstream docs are scanned too but only reported: their example keys and
tokens are public and not ours (117 findings in the full upstream corpus,
all examples). Findings print file, line and rule, never the match.

Only git-tracked files are indexed (the pipeline clones the repositories), and
`agent-backups/`, `local/`, `local-secrets/` and `**/research/**` are excluded
again in `sources.yaml` in case something was force-added.

## Sources and licenses

| Source | License | Subset |
|---|---|---|
| kubernetes/website `content/en/docs` | **CC BY 4.0** (attribution in `/SOURCES.md` of the image) | concepts, tasks, tutorials, setup, selected reference (no generated API/flag pages) |
| tektoncd/pipeline, tektoncd/triggers `docs/` | Apache-2.0 | all but developer docs and generated API |
| tektoncd/pipelines-as-code `docs/content/docs` | Apache-2.0 | all but `dev/` |
| rook/rook `Documentation/` | Apache-2.0 | getting started, storage configuration, CRDs, troubleshooting, upgrade, Helm charts |
| cert-manager/website `content/docs` | Apache-2.0 | concepts, configuration, usage, troubleshooting, FAQ, devops tips, installation, trust |
| VictoriaMetrics, VictoriaLogs, VictoriaTraces, operator `docs/` | Apache-2.0 | without changelogs, flag lists, articles |
| vmware-tanzu/velero `site/content/docs/v<x.y>` | Apache-2.0 | without contributor docs |
| istio/istio.io `content/en/docs` | Apache-2.0 | overview, concepts, ambient, ops, setup, traffic/security/observability tasks |
| royal-road/infrastructure (private) | proprietary | every git-tracked `*.md` except research notes |
| royal-road/console | Apache-2.0 | `FORK.md`, `royal-road/**/README.md`, `CHANGELOG.md`, `WP6-TRIAGE.md` |

The index image holds derived text of all of these, including private docs:
push it to a **private** registry project only.

## Size and build time

Full profile, production versions (2026-11-15):

| Index | Documents | Chunks | Size on disk | Embedding time |
|---|---|---|---|---|
| royal-road | 42 | 976 | 6.4 MB | 304 s |
| upstream | 1,448 | 14,859 | 95.8 MB | 4,717 s |

Image: 102 MB (uncompressed). Measured with the same scripts and image in
Docker on a shared 12-core host under heavy load (8 threads, about 3 chunks
per second, 84 minutes in total); a pod with dedicated CPUs should be several
times faster, and the run timeout is 2 h. Corpus: 0.97 MB of Royal Road
Markdown, 15 MB upstream. Peak memory of the index step: about 1.6 GiB (limit
4 GiB). OLS with the full index loaded: 1.1 GB resident (loads in about 1 s;
a retrieval takes 35–340 ms on CPU). The Task requests 2 CPUs (limit 4) for
embedding; the other steps are small. A run whose fingerprint exists takes
about a minute (two shallow clones, discovery, a registry lookup).

## Apply

Prerequisites: Tekton Pipelines with the cluster resolver and the shared
library in namespace `tekton-catalog` (`git-clone`); a default pod
template with `fsGroup: 65532` (the Tasks run as UID 65532); OLS from
`../` (the `docs-index` volume and `reference_content`); Kubernetes ≥ 1.36
for image volumes.

1. Secrets in namespace `lightspeed-docs` (through your secret flow; shapes
   in `tekton/examples/`):
   - `lightspeed-docs-harbor-push`: a registry robot that can pull and push
     `<project>/lightspeed-docs-index` (discover looks the tag up, the index Task's skopeo step pushes).
   - `lightspeed-docs-infra-ssh`: read-only deploy key of the infrastructure
     repository, for scheduled and manual runs.
   - `lightspeed-docs-embeddings` (key `apikey`): API key of the embeddings
     service, allowed only for its model; and set `embeddings-url` in the
     PipelineRun templates. Without them, runs embed on CPU.
   - OLS pulls the image too: add the registry's pull Secret to
     `imagePullSecrets` of `../42-ols.yaml` (commented there).
2. `kubectl apply --server-side -k royal-road/deploy/lightspeed/docs`
3. First run, without touching OLS:
   ```sh
   sed 's/^  params:/  params:\n    - {name: rollout, value: "false"}/' \
     royal-road/deploy/lightspeed/docs/tekton/examples/pipelinerun.yaml | kubectl create -f -
   ```
   Its `FINGERPRINT` result and the image digest give the first reference.
   Put `<image>:<fingerprint>@<digest>` for `<docs-index-image>` in
   `../42-ols.yaml` and apply it with `../40-ols-config.yaml`. From then on
   the pipeline owns the reference. (On a fresh install you can instead apply
   OLS with the placeholder and run with rollout on: OLS waits with
   `InvalidImageName` until the run patches it.)
   Replace `<registry>/<project>` in the PipelineRun templates
   (`tekton/40-schedule.yaml`, `tekton/pac/.tekton/`, `tekton/examples/`) with
   your private registry project.
4. Pipelines-as-Code: apply `tekton/pac/repository.yaml` and commit
   `tekton/pac/.tekton/lightspeed-docs-index.yaml` to the infrastructure
   repository as `.tekton/lightspeed-docs-index.yaml`. Pushes to `main` that
   change a `.md` file then start a run.

Check a run:

```sh
tkn -n lightspeed-docs pipelinerun describe --last    # or:
kubectl -n lightspeed-docs get pipelinerun -o custom-columns=NAME:.metadata.name,STATUS:.status.conditions[0].reason,RESULTS:.status.results
```

## A fetch tool for everything else?

Evaluated: an MCP fetch server (`mcp-server-fetch`) restricted to doc hosts
with `--allowed-hosts`, so the model could read pages that aren't indexed.
**Recommendation: not now.** The index already covers what the cluster runs,
at its versions, with citations. A fetch tool would add internet egress from
the cluster and put arbitrary page text into the prompt (prompt-injection
surface, even on allowlisted hosts with user-editable content such as GitHub).
The server only speaks stdio, so OLS would need an HTTP bridge in front of it,
and its HTML extraction installs unpinned npm packages at run time unless
`--no-readability-js` is set. Pages are long for a 32k-token context.
Revisit if users keep asking about things outside the index: run it with
`--allowed-hosts` for the doc hosts in `sources.yaml`, `--no-readability-js`,
behind an egress policy, as a second MCP server in `../40-ols-config.yaml`.

## Verified on kind

2026-11-15, kind 0.30 with `kindest/node:v1.36.1` (containerd 2.3.1), Tekton
Pipelines v1.15.5 release manifest, the `tekton-catalog` library, cert-manager
v1.20.2, an in-cluster registry and a git daemon (`test/fixtures.yaml`) in
place of Harbor and GitHub, and the OLS stack from `../` with the real
GPUStack `lightspeed` model. Profile `smoke` (a few files per source; the full
Royal Road infra docs subset: README, LEDGER, Tekton READMEs).

| Check | Result |
|---|---|
| First run, OLS on the placeholder reference | discover: Kubernetes 1.36.1 (`/version`), Tekton 1.15.5 (controller image), Rook 1.20.3 (operator image), PaC not installed → skipped. Built `fp-c8f6c737…`, gitleaks and gate clean, pushed; rollout patched OLS from `<docs-index-image>` to the digest; OLS logged "All indexes are loaded" and turned Ready. 8 min 38 s. |
| Rollback | Rollout Task with a digest that doesn't exist, timeout 2 min: pod `ImagePullBackOff`, Task restored the previous reference and failed. |
| Ordering | Rollout Task with a discovery time older than the Deployment's: "leaving it", no change. |
| Overlap | Found on kind: with the schedule every 5 min a second run started during a build, built the same fingerprint again, and a rollout reported the other run's success. Fixed (section Rollout); afterwards a CronJob job created during a run logged "1 lightspeed-docs run(s) in progress; skipping". |
| Full index | Built from the full profile (production versions), pushed to the kind registry, rolled with the rollout Task: OLS 1.1 GB, Ready. |
| Daily schedule, nothing changed | CronJob (temporarily every 5 min) created the run; same fingerprint, image found → index and image skipped, rollout "already uses …", OLS pod not restarted. 77 s. |
| Rook operator image v1.20.3 → v1.21.2 | Next scheduled run: new fingerprint `fp-4414f57a…`, fetched rook `v1.21.2`, built, pushed, rolled OLS onto it; previous digest in `lightspeed-docs/previous-index`. 7 min 13 s, no manual step. |
| RBAC | discover read only the named Deployments; rollout needed only get/list/watch/patch on the one Deployment (`rollout status` works with `resourceNames`). |
| Questions (real model) | See the PR description: Kubernetes, the infrastructure ledger, the Tekton library, Rook upgrade after the bump, Harbor and VictoriaLogs on the full index; `referenced_documents` link to the versioned pages. |

## Not verified

- Production Harbor (push with a robot account, image volume pull with the
  namespace pull Secret, retention rule), Pipelines-as-Code with the GitHub
  App on the infrastructure repository, the SSH deploy-key clone.
- A full-profile build inside the cluster (built with the same scripts and
  image in Docker, then rolled out on kind, see above).
- The console panel in a browser: verified through OLS's API (the plugin
  renders the same `referenced_documents`).
