# Configure Namespace-scoped Helm Chart Repositories Using Namespaced CRDs

The cluster-scoped [HelmChartRepository](https://github.com/openshift/api/blob/master/helm/v1beta1/0000_10-helm-chart-repository.crd.yaml) custom resource definition (CRD) for Helm repository provides the ability for admins to add Helm repositories as custom resources (CRs). For Helm chart repositories that support TLS authentication, the TLS configuration secret has to be created in the `openshift-config` namespace.

The namespace-scoped `[ProjectHelmChartRepository](https://github.com/openshift/api/blob/master/helm/v1beta1/0000_10-project-chart-repository.crd.yaml)` CRD allows project members with the appropriate RBAC permissions to create Helm repository resources of their choice but scoped to their namespace. Such project members can see charts from both cluster-scoped and namespace-scoped Helm repository resources (CRs). For namespace-scoped Helm chart repositories that support TLS authentication, the TLS configuration secret and certificate authority (CA) config map must be created in the  namespace where the repository is getting instantiated. The namespace-scoped Helm chart repositories also support basic authentication. A user can create a secret with a username and password in order to add authentication for their repository.

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
  # optional: tlsClientConfig is an optional reference to a secret by name that contains the PEM-encoded TLS client certificate and private key to present when connecting to the server. The key "tls.crt" is used to locate the client certificate. The key "tls.key" is used to locate the private key. The namespace for this secret must be same as the namespace where the project helm chart repository is getting instantiated.
  # optional: ca is an optional reference to a config map by name containing the PEM-encoded CA bundle. It is used as a trust anchor to validate the TLS certificate presented by the remote server. The key "ca-bundle.crt" is used to locate the data. If empty, the default system roots are used. The namespace for this configmap must be same as the namespace where the project helm chart repository is getting instantiated.
  # optional: basicAuthConfig is an optional reference to a secret by name that contains the basic authentication credentials to be present when connecting to the server. The key "username" is used to locate the username. The key "password" is used to locate the password. The namespace for this secret must be the same as the namespace where the project helm chart repository is getting instantiated.
    url: HELM_CHART_REPO_URL
    tlsClientConfig: HELM_CHART_TLS_CLIENT_CONFIG_SECRET_NAME
    ca: HELM_CHART_CA_CONFIG_MAP_NAME
    basicAuthConfig: HELM_CHART_BASIC_AUTH_SECRET_NAME
```

## Adding Namespace-scoped Custom Helm Chart Repositories

1. To add a new namespace-scoped Helm repository, add a custom Helm Chart Repository CR, for example, `azure-sample-repo` CR to your `my-namespace` namespace:

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
```

2. Verify that the `ProjectHelmChartRepository` CR is added successfully:

```
$ kubectl get projecthelmchartrepositories --namespace my-namespace
NAME          AGE
azure-sample-repo        1m
```

The addition of the namespace-scoped Helm repository does not impact the behavior of the existing cluster-scoped Helm repository.

## Adding Namespace-scoped Custom Helm Chart Repositories Supporting Basic Authentication

1. To create a project helm chart repository that supports basic authentication, create a secret with `username` and `password` in the same namespace where the repository is getting instantiated, for example, in the `my-namespace` namespace:

```bash
$ cat <<EOF | kubectl apply --namespace my-namespace
-f -
apiVersion: v1
kind: Secret
metadata:
  name: basic-secret
stringData:
  username: AzureDiamond
  password: hunter2
EOF
```

2. To add a new namespace-scoped Helm repository that supports basic authentication, add a custom Helm Chart Repository CR, for example, `azure-sample-repo` CR to your `my-namespace` namespace. Also, reference the secret created, in `name` section of `basicAuthConfig` field of the `ProjectHelmChartRepository` CR:

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
    basicAuthConfig:
      name: basic-secret
EOF
```

3. Verify that the `ProjectHelmChartRepository` CR is added successfully:

```
$ kubectl get projecthelmchartrepositories --namespace my-namespace
NAME          AGE
azure-sample-repo        1m
```

## API Endpoint `/api/helm/charts/index.yaml`

The `/api/helm/charts/index.yaml` endpoint supports a `namespace` query parameter. For example, a GET request to `/api/helm/charts/index.yaml?namespace=my-namespace` will respond an aggregated `index.yaml` file with entities extracted from both cluster-scoped and namespace-scoped Helm repositories.
