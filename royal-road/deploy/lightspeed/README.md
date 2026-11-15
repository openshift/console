# Lightspeed: AI assistant in the console

[OpenShift Lightspeed](https://github.com/openshift/lightspeed-service) on
this console, without the lightspeed-operator: a chat panel in every console
page and an "Ask OpenShift Lightspeed" button in the YAML editor. Answers come
from a GPUStack model, grounded in documentation (our own docs and the
upstream docs for the versions the cluster runs, [`docs/`](docs/README.md)).
The assistant can read live cluster state through a read-only Kubernetes MCP
server, always with the signed-in user's own permissions.

```
browser ── /api/proxy/plugin/lightspeed-console-plugin/ols/ ──> bridge (console namespace)
                                    user's OIDC token, CSRF-checked │ HTTPS, namespace CA
                                                                    v
                         OLS (openshift-lightspeed) ── TokenReview + SubjectAccessReview ──> kube-apiserver
                           │                      └── chat completions + tools ──> GPUStack
                           ├── user's token ──> kubernetes-mcp-server (read-only) ──> kube-apiserver
                           └── X-API-Key ──> sentry-mcp (read-only token) ──> sentry-web (Sentry API)
bridge ── plugin assets (HTTP 8080) ──> lightspeed-console-plugin
```

No console code changes are needed. The bridge loads the plugin with
`BRIDGE_PLUGINS` and routes chat requests to OLS with `BRIDGE_PLUGIN_PROXY`.

## Files

| File | What it is |
|---|---|
| `00-namespace.yaml` | Namespace `openshift-lightspeed`. |
| `10-rbac.yaml` | OLS ServiceAccount (TokenReview/SubjectAccessReview create), MCP ServiceAccount (no RBAC), ClusterRole `lightspeed-query-access` (`/ols-access` get, plus get on the inert OLSConfig). |
| `20-tls.yaml` | cert-manager: namespace-local CA and the OLS serving certificate. |
| `40-ols-config.yaml` | OLS config (GPUStack provider, MCP server, documentation indexes, TLS, no data collection, no audit spans) and the system prompt. |
| `41-ols-shim-configmap.yaml` | Generated from `royal-road/plugins/lightspeed-service/rr_ols_shim.py`. Do not edit. |
| `42-ols.yaml` | OLS Deployment and Service (HTTPS 8443); the documentation index as image volume `docs-index` at `/rag`. |
| `50-mcp-server.yaml` | kubernetes-mcp-server v0.1.3: read-only, token passthrough only. |
| `55-sentry-mcp.yaml` | Sentry MCP server (getsentry's, behind supergateway): eight read-only Sentry tools with one read-only service token. Needs the Secret `lightspeed-sentry`; see [Sentry tools](#sentry-tools). |
| `60-console-plugin.yaml` | Plugin Deployment and Service (HTTP 8080). |
| `70-networkpolicy.yaml` | Ingress: console → OLS, console → plugin, OLS → MCP, OLS → Sentry MCP. Nothing else. Egress of the Sentry MCP server: sentry-web and DNS only. |
| `80-consoleplugin.yaml` | ConsolePlugin for Administration › Dynamic Plugins (display only). |
| `90-olsconfig.yaml` | Inert `OLSConfig/cluster`: turns on the YAML editor button. |
| `docs/` | The documentation index: Tekton Pipeline that discovers versions, builds the index image and rolls OLS onto it. [README](docs/README.md). |
| `plugin-proxy.sh` | Prints the `BRIDGE_PLUGIN_PROXY` value, with the CA from `20-tls.yaml`. |
| `optional/query-access-binding.yaml` | Lets a group (or users) other than cluster-admins use the assistant. |
| `optional/ols-egress-networkpolicy.yaml` | Restricts OLS egress to DNS, kube-apiserver, MCP and GPUStack. |
| `examples/gpustack-secret.example.yaml` | Shape of the API key Secret. **Do not apply in production.** |

Images (all public):

| Component | Image |
|---|---|
| OLS | `quay.io/openshift-lightspeed/lightspeed-service-api@sha256:63924c0e…` (lightspeed-service `main` @ `77e4fcb4`, 2026-11-14; no release tags exist) |
| MCP server | `quay.io/containers/kubernetes_mcp_server@sha256:63471556…` (v0.1.3) |
| Sentry MCP | `ghcr.io/royal-road/sentry-mcp:<sha>`, built by `.github/workflows/royal-road-sentry-mcp.yml` from [`royal-road/plugins/sentry-mcp/`](../../plugins/sentry-mcp/README.md) (`@sentry/mcp-server` 0.49.0, `supergateway` 4.2.2) |
| Plugin | `ghcr.io/royal-road/lightspeed-console-plugin:<sha>`, built by `.github/workflows/royal-road-lightspeed-plugin.yml` from [`royal-road/plugins/lightspeed-console-plugin/`](../../plugins/lightspeed-console-plugin/README.md) |

## Prerequisites

- cert-manager (for `20-tls.yaml`).
- The CRDs `consoleplugins.console.openshift.io` and
  `olsconfigs.ols.openshift.io` from [`../crds/`](../crds/README.md). Without
  them, skip `80-consoleplugin.yaml` and `90-olsconfig.yaml`; the chat still
  works, only the Dynamic Plugins entry and the YAML editor button are missing.
- A GPUStack model with tool calling enabled, reachable from the namespace
  through GPUStack's OpenAI-compatible API (`.../v1`), and an API key for it.
- The Secret `lightspeed-gpustack` in `openshift-lightspeed`, key `apikey`,
  holding that key. Create it through the infrastructure secret flow.
  `examples/gpustack-secret.example.yaml` only shows its shape.

## Placeholders

| Placeholder | File | Value |
|---|---|---|
| `<gpustack-service>`, `<gpustack-namespace>`, `<gpustack-port>` | `40-ols-config.yaml` | GPUStack's in-cluster Service, namespace and port. The model name is `lightspeed`; change it there if the GPUStack route is named differently. |
| `<sha>` | `60-console-plugin.yaml` | Tag CI pushed for the plugin image. |
| `<docs-index-image>` | `42-ols.yaml` | The first index image, `<repository>:fp-…@sha256:…`; the docs pipeline owns it afterwards ([docs/README.md](docs/README.md#apply)). Also add its registry's pull Secret to `imagePullSecrets` there. |
| `<console-namespace>` | `70-networkpolicy.yaml` | Namespace of the console Deployment. |
| `<lightspeed-users-group>` | `optional/query-access-binding.yaml` | Only if you apply it. |
| `<apiserver-cidr>`, `<apiserver-port>`, `<gpustack-namespace>`, `<gpustack-port>` | `optional/ols-egress-networkpolicy.yaml` | Only if you apply it. See the file header. |

## Apply

Run from the repository root, with the placeholders replaced.

1. CRDs (if not applied yet), then wait for them:

   ```sh
   kubectl apply -f royal-road/deploy/crds/90_consoleplugins.crd.yaml \
                 -f royal-road/deploy/crds/ols.openshift.io_olsconfigs.yaml
   kubectl wait --for=condition=Established \
     crd/consoleplugins.console.openshift.io crd/olsconfigs.ols.openshift.io
   ```

2. The namespace and the API key Secret must exist (see Prerequisites). Then
   everything else:

   ```sh
   kubectl apply -f royal-road/deploy/lightspeed/
   kubectl -n openshift-lightspeed wait --for=condition=Ready certificate --all --timeout=120s
   kubectl -n openshift-lightspeed rollout status deploy/lightspeed-app-server --timeout=10m
   kubectl -n openshift-lightspeed rollout status deploy/kubernetes-mcp-server
   kubectl -n openshift-lightspeed rollout status deploy/lightspeed-console-plugin
   ```

   `kubectl apply -f <dir>` is not recursive, so `optional/` and `examples/`
   are not applied (nor `docs/`, which has its own kustomization). OLS can
   take a few minutes the first time (2.6 GB image).
   If `lightspeed-app-server` starts before its TLS Secret exists, it waits in
   `ContainerCreating` until cert-manager issues it. The OLS log should end
   with `LLM connection checked - LLM is ready`.

3. Point the console at the plugin and OLS. Add the plugin to the existing
   `BRIDGE_PLUGINS` value (comma-separated, trailing `/` required):

   ```
   lightspeed-console-plugin=http://lightspeed-console-plugin.openshift-lightspeed.svc.cluster.local:8080/
   ```

   so that with the other plugins it reads, for example:

   ```
   BRIDGE_PLUGINS=networking-console-plugin=http://networking-console-plugin.<console-namespace>.svc.cluster.local:8080/,monitoring-plugin=http://monitoring-plugin.<console-namespace>.svc.cluster.local:9443/,lightspeed-console-plugin=http://lightspeed-console-plugin.openshift-lightspeed.svc.cluster.local:8080/
   ```

   and set `BRIDGE_PLUGIN_PROXY` to the output of `plugin-proxy.sh`:

   ```sh
   royal-road/deploy/lightspeed/plugin-proxy.sh
   # {"services":[{"consoleAPIPath":"/api/proxy/plugin/lightspeed-console-plugin/ols/",
   #   "endpoint":"https://lightspeed-app-server.openshift-lightspeed.svc:8443",
   #   "caCertificate":"-----BEGIN CERTIFICATE-----\n...","authorize":true}]}
   ```

   Both in one step (this restarts the console):

   ```sh
   kubectl -n <console-namespace> set env deployment/<console-deployment> \
     BRIDGE_PLUGINS="<existing value>,lightspeed-console-plugin=http://lightspeed-console-plugin.openshift-lightspeed.svc.cluster.local:8080/" \
     BRIDGE_PLUGIN_PROXY="$(royal-road/deploy/lightspeed/plugin-proxy.sh)"
   ```

   Or put the same two values into the Deployment manifest in the
   infrastructure repository. The CA certificate is public; the value holds
   no secret. On start-up the bridge logs
   `/api/proxy/plugin/lightspeed-console-plugin/ols/ -> https://lightspeed-app-server.openshift-lightspeed.svc:8443`.

4. Optional: `optional/query-access-binding.yaml` to widen access, and
   `optional/ols-egress-networkpolicy.yaml`.

## Who can use it

OLS lets a request through only if the user may `get` the non-resource URL
`/ols-access` (a SubjectAccessReview with the user's name and groups).
`cluster-admin` allows every non-resource URL, so **cluster-admins can use it
with no binding**, and everyone else gets "not authorized" (HTTP 403 from
`/authorized`). To widen access, apply `optional/query-access-binding.yaml`
with a group (Dex groups claim, including the API server's groups prefix) or
users.

Being allowed to chat grants nothing in the cluster. Tool calls carry the
user's own token to the MCP server, which passes it to kube-apiserver, so a
user sees only what their RBAC lets them read; a tool the user can't run
returns "forbidden" and the model says so. The MCP server registers only
read-only tools and refuses Secrets and RBAC objects for everyone.

The YAML editor button shows for users who can `get` `olsconfigs/cluster`:
cluster-admins, plus whoever `lightspeed-query-access` is bound to.

## Decisions

**LLM provider: `openai` type with `use_responses_api: false`.** OLS then
calls GPUStack's `/v1/chat/completions` through LangChain's `ChatOpenAI`.
Chat completions is the endpoint every OpenAI-compatible server implements
fully, and the one SGLang's tool-call parser serves (`finish_reason:
tool_calls`); OLS binds MCP tools as OpenAI `tools` there. The `openai` type
defaults to the Responses API (`/v1/responses`). GPUStack answers it, but
streaming and tool-call events there are newer and less complete on
OpenAI-compatible servers. `rhoai_vllm` would also use chat completions, but
adds `top_p`/`frequency_penalty` defaults that OLS then drops with a warning
on every request. Qwen's reasoning arrives in `reasoning_content`, which OLS
ignores, so answers contain no thinking text.

**TLS: cert-manager CA in the namespace, passed to the bridge per route.**
OLS receives users' bearer tokens, so the bridge → OLS hop is HTTPS. The
bridge's `BRIDGE_SERVICE_CA_FILE` is a different, cluster-local CA; a
`caCertificate` in `BRIDGE_PLUGIN_PROXY` replaces it for this route only, so
nothing else the bridge proxies is affected and no other component has to
trust the new CA. The CA lives 10 years; the serving certificate 1 year and
is renewed 30 days early. OLS reads the certificate only at start-up, so
restart it in that window (`kubectl -n openshift-lightspeed rollout restart
deploy/lightspeed-app-server`). The plugin and MCP server serve plain HTTP:
the plugin serves public static files, and the MCP server is reachable only
from OLS (NetworkPolicy).

**No operator.** The lightspeed-operator's images are on
`registry.redhat.io`, and it expects OpenShift (ClusterVersion, the console
operator, service CA). We write what it would generate.

**The shim.** OLS exits without `clusterversions.config.openshift.io`, and
fails every request from users without a UID, which is every Dex user. See
[`royal-road/plugins/lightspeed-service/`](../../plugins/lightspeed-service/README.md).

**Conversation cache: memory, one replica.** History survives page reloads
only within a pod's life; the plugin keeps none either. PostgreSQL is an
option if history must survive restarts.

**Documentation: our own index, not Red Hat's.** Red Hat's documentation
index is behind Red Hat authentication and is OpenShift-specific. Instead,
OLS's "bring your own knowledge" indexes hold our docs and the upstream docs
for the versions this cluster runs, rebuilt when those change
([`docs/`](docs/README.md)). The system prompt in `40-ols-config.yaml` tells
the model this is upstream Kubernetes, not OpenShift, to prefer our docs for
questions about this cluster, and to cite.

## Sentry tools

`55-sentry-mcp.yaml` gives the assistant read access to the self-hosted
Sentry, so "why is my-app erroring?" combines the workload's state
(pods, restarts, events, logs) with its unresolved Sentry issues. The system
prompt in `40-ols-config.yaml` tells the model to look in both places and to
match the application to a Sentry project by name with `find_projects`.

How it is kept read-only and contained:

| Layer | Setting |
|---|---|
| Sentry token | Internal integration with `org:read`, `project:read`, `event:read` only. |
| MCP server | Only the read-only `inspect` skill; limited to one organization. |
| Gateway | Exposes 8 tools (`find_projects`, `search_issues`, `get_issue_details`, `get_event_stacktrace`, `search_issue_events`, `get_issue_tag_values`, `find_releases`, `get_release_details`) and refuses the rest. Not exposed: tools that write or send data to sentry.io, fetch docs from the internet, or return end-user data (replays, attachments, user feedback). |
| API key | OLS sends `X-API-Key` from a file; the gateway answers 401 without it. OLS mounts only that key, not the Sentry token. |
| NetworkPolicy | Only OLS may connect; the server may connect only to sentry-web:9000 and DNS. |

**Access model.** The Sentry MCP server uses one service token, not the
console user's identity: every Lightspeed user can read every project in the
organization, including event details such as tags and stack traces. That is
acceptable because Lightspeed is limited to users with `get` on `/ols-access`,
by default cluster-admins only (`10-rbac.yaml`). Before granting access to
others with `optional/query-access-binding.yaml`, make sure they may read all
of Sentry too, or leave the Sentry server out. Calls are not attributed to the
user in Sentry's logs; they appear as the integration.

### Set up

1. In Sentry (organization settings › Custom Integrations), create an
   **internal integration** named "Lightspeed MCP (read-only)" with
   Project: Read, Issue & Event: Read, Organization: Read, and no other
   permissions, and no webhooks.
2. Create the Secret without printing the token: paste it on stdin (the
   terminal does not echo it), and generate the gateway key in the same step:

   ```sh
   read -rs SENTRY_TOKEN
   kubectl -n openshift-lightspeed create secret generic lightspeed-sentry \
     --from-file=token=<(printf %s "$SENTRY_TOKEN") \
     --from-file=mcp-api-key=<(openssl rand -hex 32 | tr -d '\n')
   unset SENTRY_TOKEN
   ```

   Or create the same two keys through the infrastructure secret flow.
3. Replace the placeholders in `55-sentry-mcp.yaml` (`<sha>`,
   `<sentry-namespace>`, `<sentry-org>`) and `70-networkpolicy.yaml`
   (`<sentry-namespace>`), then apply both and `40-ols-config.yaml`,
   `42-ols.yaml`; restart OLS so it reads the new config and key:

   ```sh
   kubectl -n openshift-lightspeed rollout status deploy/sentry-mcp
   kubectl -n openshift-lightspeed rollout restart deploy/lightspeed-app-server
   ```

Without the Secret, OLS still starts (the key volume is optional) and logs
that it cannot read the header file; the chat works without the Sentry tools.

To rotate the gateway key, replace `mcp-api-key` in the Secret and restart
both `sentry-mcp` and `lightspeed-app-server`. Both read it only at start-up,
and OLS sends the whole file as one header value, so a two-key file doesn't
help here.

## Verify

1. Sign in as a cluster-admin. The Lightspeed button is at the bottom right;
   ask "What is a Pod?" and get a streamed answer.
2. Ask "List the pods in the openshift-lightspeed namespace." The answer
   names the three pods and shows a `pods_list_in_namespace` tool chip.
3. Sign in as a user who is not a cluster-admin (and not in the optional
   binding): the chat shows "not authorized".
4. Open any YAML editor as a cluster-admin: the toolbar has the Lightspeed
   icon, and it opens the chat.
5. Administration › Dynamic Plugins lists `lightspeed-console-plugin`.
6. With the Sentry tools: ask "Why is <app> erroring?" for an app that
   reports to Sentry. The answer names Sentry issues (for example
   `<PROJECT>-123`) with event counts, and shows `find_projects` and
   `search_issues` tool chips next to the pod tools.

## Rollback

1. Restore `BRIDGE_PLUGINS` without the Lightspeed entry and remove
   `BRIDGE_PLUGIN_PROXY` (or restore the console Deployment backup). The
   console works as before; nothing in core depends on Lightspeed.
2. Optionally remove the stack, keeping the namespace and the API key Secret:

   ```sh
   for f in royal-road/deploy/lightspeed/[1-9]*.yaml; do
     kubectl delete --ignore-not-found -f "$f"
   done
   kubectl delete --ignore-not-found -f royal-road/deploy/lightspeed/optional/
   ```

   The OLSConfig CRD is inert and can stay.

## Upgrading OLS

The image has no release tags and the shim patches private names, so:

1. Pick the new digest (`quay.io/openshift-lightspeed/lightspeed-service-api:latest`).
2. Run `python rr_ols_shim.py --check` in it (CI does this for the pinned
   digest):

   ```sh
   docker run --rm --entrypoint python \
     -v "$PWD/royal-road/plugins/lightspeed-service:/rr-shim:ro" \
     quay.io/openshift-lightspeed/lightspeed-service-api@sha256:<new> /rr-shim/rr_ols_shim.py --check
   ```

3. Diff `ols/app/models/config.py` between the old and new commit for
   renamed config keys, then repeat the kind check below.

## Verified on kind

2026-11-14, kind 0.30 (Kubernetes 1.34, kindnet with NetworkPolicy), set up
like production:

- Console image built from `4364f64637` **in-cluster**
  in `openshift-console`: `BRIDGE_K8S_MODE=in-cluster`,
  `BRIDGE_USER_AUTH=oidc` against Dex, `BRIDGE_SERVICE_CA_FILE` set, plugin
  loaded with `BRIDGE_PLUGINS`, proxy set from `plugin-proxy.sh`.
- Dex as the OIDC issuer, trusted by kube-apiserver through an
  `AuthenticationConfiguration` (username from `email`, groups with prefix
  `oidc:`, no UID mapping, so TokenReview returns no UID as in production).
  `carl@example.com` bound to `cluster-admin` as a User; `kilgore@kilgore.trout`
  (group `authors`) with no cluster-wide role.
- cert-manager v1.21.3; these manifests applied unchanged except for the
  placeholders. GPUStack was the real `lightspeed` model, reached through its
  public OpenAI-compatible URL instead of the in-cluster Service.

Results:

| Check | Result |
|---|---|
| Certificates | Both `Ready`; OLS serves HTTPS 8443; the bridge verifies it with `caCertificate`. |
| Chat as cluster-admin, no binding | `/authorized` 200, `/v1/streaming_query` 200, answer streamed into the panel. OLS log: user ID is the shim's UUIDv5, 15 tools loaded from MCP, LLM round in 1.6 s. |
| Tool call as cluster-admin | "List the pods in openshift-lightspeed" → `pods_list_in_namespace`, correct three pods. |
| Non-admin, no binding | `/authorized` 403, panel shows "not authorized". YAML editor button hidden. |
| Non-admin with `optional/query-access-binding.yaml` (group `oidc:authors`) and `view` in one namespace | Chat works; "List the pods in kube-system" → tool error `pods is forbidden: User "kilgore@kilgore.trout" cannot list resource "pods" ... in the namespace "kube-system"`, which the model reports. |
| YAML editor | Cluster-admin sees "Ask OpenShift Lightspeed"; it opens the chat. |
| `70-networkpolicy.yaml` | console → OLS 200; console → MCP, and a pod in `default` → OLS, MCP or plugin: blocked. Probes unaffected. |
| `optional/ols-egress-networkpolicy.yaml` | With it, `/authorized` (TokenReview/SAR), the LLM and tool calls still work; OLS → plugin is blocked. |
| Memory | OLS about 0.9 GiB (1.1 GB with the full documentation index, see docs/README.md), MCP server 27 MiB, plugin 56 MiB. |

Not verified on kind: production's real Dex and groups, GPUStack through its
in-cluster Service (`http://`, so no CA is involved), and certificate renewal.

### Sentry tools, verified on kind

2026-11-15, same kind setup as above (OLS image, shim and manifests applied
unchanged except for placeholders; TLS Secrets made with openssl instead of
cert-manager). A stand-in `sentry-web` Service in namespace `sentry`, with the
production chart's pod labels, proxied to the real self-hosted Sentry, so
`SENTRY_URL` and the egress policy were as in production. The model was the
real GPUStack `lightspeed` route. The token was a real read-only token.

| Check | Result |
|---|---|
| Tools | The gateway listed the 8 allowed tools; the full `inspect` skill has 49. |
| "Why is <app> erroring?" for a test Deployment named like a real application (cluster-admin) | 25 s. Calls: `pods_list`, `find_projects` (matched the Deployment to its project, whose slug is spelt differently), `search_issues`, `pods_log`, `get_issue_details`, `events_list`. The answer said the pods were healthy and listed the project's real unresolved issues with event counts and last-seen times. Same in the console chat panel. |
| API key | Without `X-API-Key`: 401. With it: 200. OLS's key mount holds only `mcp-api-key`. |
| NetworkPolicy | OLS → sentry-mcp allowed; a pod in `default` → sentry-mcp blocked. sentry-mcp → sentry-web:9000 allowed; → the public Sentry host and the npm registry blocked. |
