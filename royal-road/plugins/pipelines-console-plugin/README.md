# pipelines-console-plugin build

Builds [openshift-pipelines/console-plugin](https://github.com/openshift-pipelines/console-plugin) for the Royal Road console. Console 5.0 no longer has Tekton pages in core; this plugin provides them:

- the admin **Pipelines** section: Overview, Pipelines and PipelineRuns, Tasks and TaskRuns, Triggers (EventListeners, TriggerTemplates, TriggerBindings, ClusterTriggerBindings);
- PipelineRun and TaskRun details with logs, the pipeline builder, Start / Add Trigger actions;
- developer perspective Pipelines and the PipelineRun decorators in Topology.

| File | Purpose |
|---|---|
| `upstream.env` | Upstream repository, branch and pinned commit. |
| `patches/*.patch` | Our changes, applied in order with `git apply`. |
| `Dockerfile` | Fetches the pinned commit, applies the patches, builds with the namespaces below, and serves `dist/` with nginx. |

CI: `.github/workflows/royal-road-pipelines-plugin.yml` builds on pull requests that touch this directory, and on `main` pushes `ghcr.io/royal-road/pipelines-console-plugin:<short-sha>` and `:main`.

Local build (context is this directory, about 10 minutes):

```sh
docker build -t pipelines-console-plugin royal-road/plugins/pipelines-console-plugin
```

## Why we build it

Upstream publishes `ghcr.io/openshift-pipelines/console-plugin` only for `main`, `master` and the operator's `release-v1.x` branches. There is no image of `release-5.0`, and the namespaces this cluster needs (below) are fixed at build time.

## Upstream ref

`release-5.0` is the branch matching the console's base. At the pinned commit it equals `release-4.23`. The plugin is built against `@openshift-console/dynamic-plugin-sdk` 4.22 and declares `@console/pluginAPI >=4.15`, which console 5.0 satisfies.

To bump:

1. Set `UPSTREAM_COMMIT` to the new tip (`git ls-remote https://github.com/openshift-pipelines/console-plugin refs/heads/release-5.0`).
2. Build. `git apply` fails loudly if a patch no longer applies. Refresh the patch, or drop it once upstream has the fix.
3. Re-run the kind check in `royal-road/deploy/README.md` ("Pipelines plugin").

## Namespaces (build arguments)

Upstream hard-codes `openshift-pipelines`, where the OpenShift Pipelines operator installs everything. Patch 0001 turns that into two build-time variables. The Dockerfile sets them as `ARG`s:

| Build arg | Our default | Upstream default | What reads it |
|---|---|---|---|
| `CLUSTER_RESOLVER_TASK_NAMESPACE` | `tekton-catalog` | `openshift-pipelines` | The pipeline builder lists Tasks from this namespace next to the Pipeline's own namespace. Picking one writes a cluster resolver `taskRef` (`resolver: cluster`, params `kind`, `name`, `namespace`). Pipeline details also use it to link cluster resolver references that have no `namespace` param. |
| `PIPELINE_NAMESPACE` | `pipelines-as-code` | `openshift-pipelines` | Pipelines-as-Code: the `pipelines-as-code-secret` Secret and the `pipelines-as-code-info` ConfigMap (GitHub App setup, Repository webhook URL). The standalone PaC release installs into `pipelines-as-code`. |

Change them with `--build-arg`, for example `--build-arg CLUSTER_RESOLVER_TASK_NAMESPACE=my-tasks`. A runtime setting would be nicer, but the plugin reads these values synchronously in many places and console plugins have no config mechanism of their own. A build argument is the smallest change upstream could accept.

The cluster resolver itself is configured by Tekton, not the console. Its ConfigMap `cluster-resolver-config` (namespace `tekton-pipelines-resolvers`) must not block the catalog namespace; the default `allowed-namespaces` is empty, which allows all. Tasks in the catalog namespace need to be readable by the users who open the builder, and by the resolver's ServiceAccount (the default install grants that cluster-wide).

The builder labels catalog Tasks with provider "Red Hat" unless the Task has the annotation `openshift.io/installed-from`; its value becomes the provider label.

## Patches

All are candidates for upstream PRs.

| Patch | Problem on plain Kubernetes | Change |
|---|---|---|
| `0001-configurable-pipelines-namespaces.patch` | Shared Tasks and PaC live outside `openshift-pipelines`. The builder offered no catalog Tasks, and the PaC pages read the wrong namespace. | `PIPELINE_NAMESPACE` and a new `CLUSTER_RESOLVER_TASK_NAMESPACE` come from `process.env` (webpack `EnvironmentPlugin`), with unchanged defaults. |
| `0002-no-route-for-trigger-without-route-api.patch` | **Add Trigger** always creates a `route.openshift.io` Route for the new EventListener. Without that API every new trigger ended with an "Error Exposing Route" dialog, although the trigger was created. | Adds a `console.flag/model` for `route.openshift.io/v1 Route` (`PIPELINES_CONSOLE_PLUGIN_ROUTE`) and skips the Route when it is off. Expose the EventListener Service with an Ingress yourself. Nothing changes on OpenShift. |
| `0003-fix-pipelinerun-logs-crash-while-loading.patch` | The PipelineRun **Logs** tab crashed intermittently with "Cannot read properties of undefined (reading 'metadata')" (2 of 3 loads on kind). This affects OpenShift too. | Backport of one line from upstream `main` (`b9e1cd7`): `obj?.metadata?.namespace`. Drop it when `release-5.0` gets the fix. |

To write a new patch: clone upstream at `UPSTREAM_COMMIT`, `git apply` the existing patches and commit them, make your change, commit it, and export it with `git format-patch -1 --zero-commit --no-signature`.

## OpenShift-only parts and how they degrade

Checked on kind (no OpenShift APIs) with upstream Tekton Pipelines and Triggers:

- **Gating.** The Pipelines section, its pages and the topology extensions need the `OPENSHIFT_PIPELINE` flag, which is a `console.flag/model` on `tekton.dev/v1 Pipeline`. It doesn't need the `OPENSHIFT` flag or any core plugin. Without the Tekton CRDs nothing appears, and `/pipelines/...` is a 404.
- **Routes.** Besides Add Trigger (patch 0002), the plugin only reads Routes: the EventListener "URL" field (empty) and the PaC controller URL lookup (errors caught). Neither breaks a page.
- **Tekton Results.** Detected by getting `tektonresults.operator.tekton.dev/result` with the user's token. Without it (404 or 403) the Results-backed pages and archived runs stay off, and the Overview page shows "Data is incomplete. To see the full view, please enable Tekton results." and draws its charts from the `tekton_pipelines_controller_*` metrics through `/api/prometheus-tenancy` ("Unable to load ..." without them). With Results installed, see `royal-road/deploy/README.md` ("Tekton Results") for the RBAC and the bridge's CA setting.
- **TektonConfig** (`operator.tekton.dev`) is read only to detect a multi-cluster hub, and a 404 means "not a hub".
- **ArtifactHub.** The builder's task search also lists ArtifactHub tasks through the bridge's `/api/dev-console/artifacthub/*` endpoints, which fetch from the internet. Without egress, only local and catalog Tasks show.
- **Sample YAML.** One of the plugin's Pipeline YAML templates references `openshift-pipelines` in a cluster resolver param. It is only a sample.
