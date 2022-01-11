# Configure Namespace Scoped Chart Repositories using namespaced CRDs

While the cluster-scoped CRD `HelmChartRepository` for Helm repository provides ability for admins to add Helm repositories as custom resources, regular users/developers need an admin's permission in order to add Helm repositories of their choice.

To avoid permission elevation, use namespace scoped CRD `ProjectHelmChartRepository`.

## Basic structure of `ProjectHelmChartRepository`

```yaml
apiVersion: helm.openshift.io/v1beta1
kind: ProjectHelmChartRepository
metadata:
  name: my-enterprise-chart-repo
spec:
  url: https://my.chart-repo.org/stable

  # optional name that might be used by console
  name: myChartRepo

  # optional and only needed for UI purposes
  description: my private chart repo

  # required: chart repository URL
  connectionConfig:
    url: HELM_CHART_REPO_URL
```

## Getting Started with `ProjectHelmChartRepository`

To add a new namespace-scoped Helm repository `stable` to a desired namespace `my-namespace`:

```bash
$ cat <<EOF | oc apply --namespace my-namespace -f -
apiVersion: helm.openshift.io/v1beta1
kind: ProjectHelmChartRepository
metadata:
  name: stable
spec:
  url: https://kubernetes-charts-incubator.storage.googleapis.com
  displayName: Public Helm stable charts
  description: Public Helm stable charts hosted on HelmHub
EOF

$ kubectl get projecthelmchartrepositories --namespace my-namespace
NAME          AGE
stable        1m
```

Note that the addition of namespace-scoped Helm repository does not impact behavior of the existing cluster-scoped Helm repository:

```bash
$ cat <<EOF | oc apply -f -
apiVersion: helm.openshift.io/v1beta1
kind: HelmChartRepository
metadata:
  name: custom-cluster
spec:
  url: https://kubernetes-charts.storage.googleapis.com
  displayName: Public Helm stable charts
  description: Public Helm stable charts hosted on HelmHub
EOF

$ cat <<EOF | oc apply --namespace my-namespace -f -
apiVersion: helm.openshift.io/v1beta1
kind: ProjectHelmChartRepository
metadata:
  name: custom-namespace
spec:
  url: https://kubernetes-charts-incubator.storage.googleapis.com
  displayName: Public Helm charts in incubator state
EOF

$ kubectl get helmchartrepositories
NAME          AGE
cluster       3h30m
custom-cluster        1m

$ kubectl get projecthelmchartrepositories --namespace my-namespace
NAME          AGE
custom-namespace     1m
```

## API Endpoint `/api/helm/charts/index.yaml`

The `/api/helm/charts/index.yaml` endpoint supports a query parameter `namespace`. For example, a GET request to /api/helm/charts/index.yaml?namespace=my-namespace will respond an aggregated index.yaml file with entities extracted from both cluster scoped Helm repository and Helm repositories in `my-namespace` namespace.
