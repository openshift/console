# OpenShift CRDs for the console

These CustomResourceDefinitions come unchanged from
[openshift/api](https://github.com/openshift/api), except
`ols.openshift.io_olsconfigs.yaml` (see [OLSConfig](#olsconfig)). Each one passes the
[OpenShift CRD policy](../../../FORK.md#openshift-crd-policy): only the console
reads these resources, and no OpenShift controller has to act on them.

| File | Source path in openshift/api | Used by |
|---|---|---|
| `00_projecthelmchartrepositories.crd.yaml` | `helm/v1beta1/zz_generated.crd-manifests/` | Helm backend and frontend (namespace-scoped chart repositories) |
| `00_consolelinks.crd.yaml` | `console/v1/zz_generated.crd-manifests/` | Masthead menus and namespace dashboard links (`FLAGS.CONSOLE_LINK`) |
| `90_consoleplugins.crd.yaml` | `console/v1/zz_generated.crd-manifests/` | Administration › Dynamic Plugins and the Overview's Dynamic Plugins status. Display only: `BRIDGE_PLUGINS` still decides what loads |
| `ols.openshift.io_olsconfigs.yaml` | openshift/lightspeed-operator `config/crd/bases/` | The YAML editor's "Ask OpenShift Lightspeed" button, shown to users who can read `OLSConfig/cluster` ([`../lightspeed/`](../lightspeed/README.md)) |

Production already has `helmchartrepositories.helm.openshift.io`. It is not
shipped here.

## Pin

openshift/api commit `6ab113cb736829b0cb17174b9b26d355e4cda3a0`. This is the
commit in the `replace github.com/openshift/api => ...` directive in the
console's `go.mod`, so the CRD schemas match the API types the bridge was
built against.

## Updating

After a rebase that moves the `go.mod` pin, fetch the files again at the new
commit:

```sh
# The replace directive holds a pseudo-version ending in the abbreviated SHA;
# raw.githubusercontent.com accepts it.
SHA=$(go mod edit -json | jq -r '.Replace[] | select(.Old.Path=="github.com/openshift/api") | .New.Version' | sed 's/.*-//')
for f in helm/v1beta1/zz_generated.crd-manifests/00_projecthelmchartrepositories.crd.yaml \
         console/v1/zz_generated.crd-manifests/00_consolelinks.crd.yaml \
         console/v1/zz_generated.crd-manifests/90_consoleplugins.crd.yaml; do
  curl -fsSL -o "royal-road/deploy/crds/$(basename "$f")" \
    "https://raw.githubusercontent.com/openshift/api/$SHA/$f"
done
```

Then update the pin above and the one in `royal-road/dev/kind-up.sh`. Do not
edit the files by hand.

## OLSConfig

`ols.openshift.io_olsconfigs.yaml` comes unchanged from
[openshift/lightspeed-operator](https://github.com/openshift/lightspeed-operator)
`config/crd/bases/`, commit `add59096391db7c944704a284321d9471e16d9df`
(`main`, 2026-11-14). No operator is installed; the only object is the inert
`OLSConfig/cluster` in `../lightspeed/90-olsconfig.yaml`, which core reads to
decide whether to show the YAML editor button. To update:

```sh
curl -fsSL -o royal-road/deploy/crds/ols.openshift.io_olsconfigs.yaml \
  https://raw.githubusercontent.com/openshift/lightspeed-operator/<sha>/config/crd/bases/ols.openshift.io_olsconfigs.yaml
```

The file is about 150 KB; plain `kubectl apply` handles it (tested), so
`--server-side` is not required.
