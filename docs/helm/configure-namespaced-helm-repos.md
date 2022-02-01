# Configure Namespace-scoped Helm Chart Repositories Using Namespaced CRDs

The cluster-scoped `[HelmChartRepository](https://github.com/openshift/api/blob/master/helm/v1beta1/0000_10-helm-chart-repository.crd.yaml)` CRD for Helm repository provides the ability for admins to add Helm repositories as custom resources.

The namespace-scoped `ProjectHelmChartRepository` CRD allows project members with the appropriate RBAC permissions to create Helm repository resources of their choice but scoped to their namespace. Such project members can see charts from both cluster-scoped and namespace-scoped Helm repository resources (CRs).

_Note_: Administrators can limit users from creating namespace-scoped Helm repository resources. By limiting users, admins have the flexibility to control the RBAC through a namespace role instead of a cluster role. Doing so avoids unnecessary permission elevation for the user and prevents access to unauthorized services or applications.

## Basic structure of `ProjectHelmChartRepository` CR

```yaml
apiVersion: helm.openshift.io/v1beta1
kind: ProjectHelmChartRepository
metadata:
  name: NAME
spec:
  url: https://my.chart-repo.org/stable

  # optional name that might be used by console
  name: CHART_REPO_DISPLAY_NAME

  # optional and only needed for UI purposes
  description: My private chart repo

  # required: chart repository URL
  connectionConfig:
    url: HELM_CHART_REPO_URL
```

## Adding Namespace-scoped Custom Helm Chart Repositories

To add a new namespace-scoped Helm repository, add a custom Helm Chart Repository CR, for example, `azure-sample-repo` CR to your `my-namespace` namespace:

```bash
$ cat <<EOF | kubectl apply --namespace my-namespace -f -
apiVersion: helm.openshift.io/v1beta1
kind: ProjectHelmChartRepository
metadata:
  name: azure-sample-repo
spec:
  name: azure-sample-repo
  connectionConfig:
    url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docs
EOF

$ kubectl get projecthelmchartrepositories --namespace my-namespace
NAME          AGE
azure-sample-repo        1m
```

The addition of the namespace-scoped Helm repository does not impact the behavior of the existing cluster-scoped Helm repository.

## API Endpoint `/api/helm/charts/index.yaml`

The `/api/helm/charts/index.yaml` endpoint supports a `namespace` query parameter. For example, a GET request to `/api/helm/charts/index.yaml?namespace=my-namespace` will respond an aggregated `index.yaml` file with entities extracted from both cluster-scoped and namespace-scoped Helm repositories.
