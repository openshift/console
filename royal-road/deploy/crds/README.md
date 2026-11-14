# OpenShift CRDs for the console

These CustomResourceDefinitions come unchanged from
[openshift/api](https://github.com/openshift/api). Each one passes the
[OpenShift CRD policy](../../../FORK.md#openshift-crd-policy): only the console
reads these resources, and no OpenShift controller has to act on them.

| File | Source path in openshift/api | Used by |
|---|---|---|
| `00_projecthelmchartrepositories.crd.yaml` | `helm/v1beta1/zz_generated.crd-manifests/` | Helm backend and frontend (namespace-scoped chart repositories) |
| `00_consolelinks.crd.yaml` | `console/v1/zz_generated.crd-manifests/` | Masthead menus and namespace dashboard links (`FLAGS.CONSOLE_LINK`) |

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
         console/v1/zz_generated.crd-manifests/00_consolelinks.crd.yaml; do
  curl -fsSL -o "royal-road/deploy/crds/$(basename "$f")" \
    "https://raw.githubusercontent.com/openshift/api/$SHA/$f"
done
```

Then update the pin above and the one in `royal-road/dev/kind-up.sh`. Do not
edit the files by hand.
