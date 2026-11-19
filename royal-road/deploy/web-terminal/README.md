# Web Terminal

The console's built-in Web Terminal (the `>_` button in the masthead) opens a
shell in a pod with `kubectl`, `helm`, `oc` and other CLIs, logged in as the
user who opened it. Agents do not apply anything here to production; the owner
applies it through the infrastructure repository.

## How it works

1. The user clicks the terminal button. The frontend creates a `DevWorkspace`
   named `terminal-<random>` that uses the `web-terminal-tooling` and
   `web-terminal-exec` DevWorkspaceTemplates.
2. The **DevWorkspace Operator** (DWO) turns it into a Deployment with two
   containers: tooling (the shell) and exec (a small HTTPS server). Its
   admission webhooks label the DevWorkspace with the creator's UID and let
   only that UID exec into the pod or change the workspace.
3. The **routing controller** (`web-terminal-routing`) creates the Service and
   a cert-manager serving certificate for the exec container. On OpenShift DWO
   does this itself, with the OpenShift service CA.
4. The bridge checks that the user's UID matches the creator label, then
   forwards the user's token to the exec container (`exec/init`). The exec
   container verifies the token belongs to that UID and writes a kubeconfig
   with it into the tooling container.
5. The frontend opens `pods/exec` into the tooling container with the user's
   own credentials, through the bridge's API proxy.

The **Web Terminal Operator** (WTO) only keeps the two DevWorkspaceTemplates up
to date. The bridge also needs its OLM Subscription: it finds the templates'
namespace from the Subscription named `web-terminal`.

## What differs from OpenShift

| OpenShift dependency | Here |
|---|---|
| DWO serves `routingClass: web-terminal` only on OpenShift. | The console sends `web-terminal-k8s` (bridge flag `--web-terminal-routing-class`, core patch), which [`web-terminal-routing`](../../web-terminal-routing/README.md) serves. |
| Workspace and DWO webhook certificates come from the OpenShift service CA. | cert-manager ([`20-certificates.yaml`](20-certificates.yaml)). |
| Users have UIDs (OpenShift OAuth). | **The API server must map an OIDC claim to the UID** (see [Prerequisite](#prerequisite-oidc-user-uids)). |
| Users pick a terminal namespace from Projects (`project.openshift.io`). | Namespaces (core patch to the webterminal plugin). |
| WTO and the tooling images are released through `registry.redhat.io`. | Upstream public builds from `quay.io/wto` (the `:next` tags; see [Versions](#versions-and-upgrades)). |

## Prerequisite: OIDC user UIDs

DWO labels each terminal with the creator's UID, and the exec container refuses
users without one (`SelfSubjectReview returned empty UID`). With the legacy
`--oidc-*` API server flags, OIDC users have no UID. Switch the API server to a
structured authentication configuration that maps `sub` to the UID. The bridge
uses the ID token's `sub` as the user ID and compares it with the creator
label, so the UID must be `sub` exactly.

This configuration is equivalent to `--oidc-issuer-url`,
`--oidc-client-id=openshift-console` and `--oidc-username-claim=email`, plus
the UID:

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AuthenticationConfiguration
jwt:
  - issuer:
      url: https://<dex-issuer-url>
      audiences: [openshift-console]
      # certificateAuthority: |   only if the issuer's certificate is not
      #   -----BEGIN ...          signed by a CA the API server trusts
    claimMappings:
      username:
        claim: email
        prefix: ""
      uid:
        claim: sub
```

On each control-plane node, one at a time:

1. Save the file as `/etc/kubernetes/authn/authentication-config.yaml`.
2. In the kubeadm `ClusterConfiguration` (`apiServer`), remove the
   `oidc-issuer-url`, `oidc-client-id` and `oidc-username-claim` extraArgs. Add
   `authentication-config: /etc/kubernetes/authn/authentication-config.yaml`
   and an extraVolume for `/etc/kubernetes/authn` (read-only). The API server
   refuses to start with both `--authentication-config` and `--oidc-*` flags.
3. Apply it (`kubeadm upgrade node` or edit
   `/etc/kubernetes/manifests/kube-apiserver.yaml` to match) and wait for the
   API server to be ready before the next node.
4. Check: `kubectl auth whoami` with an OIDC login shows the same username as
   before and a non-empty `UID`.

The UID becomes a label value, so it must be at most 63 characters of
`[A-Za-z0-9._-]` and start and end with a letter or digit. Dex's `sub` is
base64url and depends on the connector; for the local password database it is
60 characters. Check each kind of user with `kubectl auth whoami` before
relying on the terminal. A user whose `sub` doesn't fit gets an error when
creating a terminal.

Nothing else depends on the UID: RBAC, audit logs and the console keep using
the username.

## Apply

Requirements: OLM v0, cert-manager, the console image with
this change (`ghcr.io/royal-road/console:<sha>`), and the
[prerequisite](#prerequisite-oidc-user-uids).

1. **Namespaces**: [`00-namespaces.yaml`](00-namespaces.yaml) creates
   `web-terminal` (operators, templates, routing controller) and
   `openshift-terminal` (every cluster-admin's terminal; the bridge refuses
   cluster-admin terminals anywhere else).

2. **Certificates**: [`20-certificates.yaml`](20-certificates.yaml). It
   expects cert-manager's cluster resource namespace to be `cert-manager`.

   ```sh
   kubectl apply -f 20-certificates.yaml
   kubectl -n cert-manager wait --for=condition=Ready certificate/web-terminal-ca
   ```

3. **Operators**: [`10-operators.yaml`](10-operators.yaml) adds two
   CatalogSources pinned by digest, an OperatorGroup and two Subscriptions with
   `installPlanApproval: Manual`. Review and approve the InstallPlan:

   ```sh
   kubectl apply -f 10-operators.yaml
   kubectl -n web-terminal get installplan        # one plan, APPROVED=false
   kubectl -n web-terminal get installplan <name> \
     -o jsonpath='{.spec.clusterServiceVersionNames}'
   # expect ["web-terminal.v1.18.0","devworkspace-operator.v1.1.0"]
   kubectl -n web-terminal patch installplan <name> --type merge \
     -p '{"spec":{"approved":true}}'
   kubectl -n web-terminal get csv                # both Succeeded
   kubectl -n web-terminal get devworkspacetemplates
   kubectl get mutatingwebhookconfiguration,validatingwebhookconfiguration \
     controller.devfile.io
   ```

4. **Routing controller**: [`30-routing-controller.yaml`](30-routing-controller.yaml).
   Set the image to `ghcr.io/royal-road/web-terminal-routing:<sha>`.

5. **Console**:
   - [`40-console-rbac.yaml`](40-console-rbac.yaml) with the console's
     ServiceAccount filled in. The bridge reads the Subscription and DWO's
     webhook configurations with its own identity.
   - Add the terminal CA to the file `BRIDGE_SERVICE_CA_FILE` points to. The
     bridge reads every certificate in that file, so append it to the
     existing bundle; it keeps trusting the monitoring services.

     ```sh
     kubectl -n cert-manager get secret web-terminal-ca \
       -o jsonpath='{.data.ca\.crt}' | base64 -d > web-terminal-ca.crt
     cat <current-service-ca.crt> web-terminal-ca.crt > service-ca-bundle.crt
     ```

     Put the bundle where the console Deployment mounts its service CA
     (usually a ConfigMap).
   - Add to the console container's env:

     ```yaml
     - name: BRIDGE_WEB_TERMINAL_ROUTING_CLASS
       value: web-terminal-k8s
     ```

   The bridge must run in-cluster (`BRIDGE_K8S_MODE=in-cluster`): its terminal
   checks use the in-cluster client.

6. **Network**: the bridge connects to
   `https://<workspace>-service.<namespace>.svc:4444` in the terminal's
   namespace. If a NetworkPolicy in a user namespace (or `openshift-terminal`)
   blocks ingress, allow TCP 4444 from the console pods.

7. **Verify**: as a cluster-admin, click `>_`, then **Start**. The terminal
   opens within about a minute (first image pull is longer); `kubectl auth
   whoami` shows your username. Repeat as a namespace-scoped user from inside
   one of their namespaces.

## Who can open a terminal

The terminal runs as the user who opened it: the kubeconfig in the tooling
container holds that user's token, so it can do exactly what the user can do in
the console. The pod's ServiceAccount has no extra rights.

- **cluster-admins** (anyone allowed to create pods in `openshift-terminal`)
  always get their terminal in `openshift-terminal`. The bridge enforces this,
  so an admin token never sits in a namespace that other users can edit.
- **Everyone else** needs, in some namespace: create/get/list/watch/patch on
  `devworkspaces.workspace.devfile.io` and create on `pods/exec`. The built-in
  `edit` and `admin` roles have both (DWO aggregates its roles into them).
  The form's namespace dropdown lists namespaces; users without
  `list namespaces` see "Error loading" there and should open the terminal
  while viewing one of their namespaces, which the form preselects.
- Only the creator can use a terminal: DWO's webhook rejects `pods/exec` into
  it by anyone else (cluster-admins included), and the bridge rejects
  `exec/init` from anyone but the creator. A user's token stays in their
  terminal pod until the workspace stops.

One difference from OpenShift: there, DWO also stops anyone but itself from
editing the terminal's Service. DWO's webhook only lets DWO's own
ServiceAccount create such protected Services, so the routing controller's
Services are not protected. Someone who can edit Services and read Secrets in
the same namespace could redirect the bridge's `exec/init` call (which carries
the user's token) to their own pod. The controller reverts Service edits as
soon as it sees them, and `openshift-terminal` should only be writable by
cluster-admins. In shared namespaces, users should only open terminals where
they trust everyone with edit rights.

## Resources and idle timeout

Defaults from WTO's templates:

| Container | CPU request / limit | Memory request / limit |
|---|---|---|
| web-terminal-tooling | 100m / 400m | 512Mi / 4Gi |
| web-terminal-exec | 100m / 400m | 128Mi / 128Mi |

A terminal stops (scales to zero, keeps its DevWorkspace) after **15 minutes**
without input; opening the terminal again restarts it. Users can set another
timeout and a custom tooling image under the form's advanced options.

To change the defaults, edit the templates in `web-terminal` and add the
annotation `web-terminal.redhat.com/unmanaged-state: "true"` so WTO stops
overwriting them (it still updates the images):

```sh
kubectl -n web-terminal annotate dwt web-terminal-exec web-terminal-tooling \
  web-terminal.redhat.com/unmanaged-state=true
kubectl -n web-terminal edit dwt web-terminal-exec   # env WEB_TERMINAL_IDLE_TIMEOUT
kubectl -n web-terminal edit dwt web-terminal-tooling  # memoryLimit, cpuLimit
```

The console's Administration › Cluster Settings › Web Terminal page is not
available: it reads `consoles.operator.openshift.io`.

The console never deletes a terminal: closing the tab leaves it running until
the idle timeout, and the next terminal button click reuses it. A stopped
terminal keeps its DevWorkspace, Service, Certificate and Secret (a few small
objects, no pod). Deleting the DevWorkspace removes all of them.

## Versions and upgrades

| Component | Version | Image |
|---|---|---|
| DevWorkspace Operator | v1.1.0 | `quay.io/devfile/devworkspace-controller:v1.1.0` |
| Web Terminal Operator | 1.18.0 (upstream `main`) | `quay.io/wto/web-terminal-operator:next` |
| Tooling / exec | WTO defaults | `quay.io/wto/web-terminal-tooling:next`, `quay.io/wto/web-terminal-exec:next` |
| Routing controller | this repository | `ghcr.io/royal-road/web-terminal-routing:<sha>` |

Both CatalogSources are pinned by digest and both Subscriptions use Manual
approval, so nothing changes until the digest in `10-operators.yaml` changes
and someone approves the resulting InstallPlan. WTO's only public builds are
`:next` tags from its main branch: the bundle is pinned, but the images it
references are tags, so a pod restart on a node without the image cached can
pull a newer build. To pin them, replace the images in the templates with
digests after setting `unmanaged-state` (above).

## Known issues

- **Every `kubectl exec` in the cluster goes through DWO's webhook.**
  `validatingwebhookconfiguration/controller.devfile.io` has a
  `validate-exec` webhook for all `pods/exec` with `failurePolicy: Fail` and
  no object selector (it only denies exec into restricted terminal pods). If
  both `devworkspace-webhook-server` replicas in `web-terminal` are down,
  `kubectl exec` and the console's pod terminal fail everywhere. Alert on that
  Deployment's availability.

- **WTO restarts about every 40 minutes.** It watches OpenShift's
  `APIServer` resource for TLS settings; after 10 failed attempts it exits
  (code 0) and restarts. It re-syncs the templates and has no other effect,
  but the pod's restart count grows. Exclude
  `web-terminal/web-terminal-controller` from restart alerts.
- **WTO's catalog runs in `legacy` mode.** Its index is in the old SQLite
  format, which crash-loops under `securityContextConfig: restricted`.
- The UI says "OpenShift command line terminal" and the welcome banner says
  "OpenShift Web Terminal".

## Rollback

1. Remove `BRIDGE_WEB_TERMINAL_ROUTING_CLASS` from the console (the button
   disappears once the Subscription is gone; existing terminals stop working
   once the routing controller is gone).
2. Delete all terminals: `kubectl delete devworkspace -A -l console.openshift.io/terminal=true`.
3. Delete [`30-routing-controller.yaml`](30-routing-controller.yaml) and
   [`40-console-rbac.yaml`](40-console-rbac.yaml).
4. Delete the two Subscriptions and their CSVs
   (`kubectl -n web-terminal delete subscription --all; kubectl -n web-terminal delete csv --all`),
   then the CatalogSources and OperatorGroup. Then **delete the webhook
   configurations** (`kubectl delete mutatingwebhookconfiguration,validatingwebhookconfiguration controller.devfile.io`):
   DWO creates them and its webhook server itself, so OLM leaves both behind.
   Delete the configurations before the namespace: once the namespace (and
   with it the webhook server) is gone, every `pods/exec` in the cluster
   fails (see [Known issues](#known-issues)). OLM also leaves the
   `workspace.devfile.io` and `controller.devfile.io` CRDs; delete them last
   if you want them gone.
5. Delete [`20-certificates.yaml`](20-certificates.yaml) and the namespaces.
   Remove the terminal CA from the bridge's CA bundle.
6. Cluster-scoped leftovers (checked on kind): DWO's
   `clusterrole`/`clusterrolebinding` `devworkspace-webhook-server`, the
   bundle's ClusterRoles `devworkspace-controller-edit-workspaces`,
   `-view-workspaces` and `-metrics-reader`, and OLM's per-CRD roles, which go
   with the CRDs.
7. The API server's authentication configuration can stay; UIDs are harmless
   without the terminal.
