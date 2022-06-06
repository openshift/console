# Shipwright Plugin

Console extension for [Shipwright](https://shipwright.io/) Builds

Tested with version 0.9

## Installation

### Setup Operators

#### 1. Install Red Hat OpenShift Pipelines from the OperatorHub (Red Hat catalog)

#### 2. Install Shipwright Operator from the OperatorHub (operatorhubio-catalog)

To automate this:

```
kubectl apply -f https://operatorhub.io/install/shipwright-operator.yaml
```

or

```yaml
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: my-shipwright-operator
  namespace: operators
spec:
  channel: alpha
  name: shipwright-operator
  source: operatorhubio-catalog
  sourceNamespace: olm
```

#### 3. Start the Shipwright controller

You will not see the Build and BuildRun CRDs before applying this:

```yaml
apiVersion: operator.shipwright.io/v1alpha1
kind: ShipwrightBuild
metadata:
  name: shipwright-operator
spec:
  targetNamespace: shipwright-build
```

### Import strategies

Apply samples/samples-stategies.yaml

* [BUILD-432 - Dev Preview - Unprivileged Builds](https://issues.redhat.com/browse/BUILD-432)


```yaml
apiVersion: shipwright.io/v1alpha1
kind: Build
metadata:
  name: buildpack-nodejs-build3
spec:
  source:
    url: https://github.com/shipwright-io/sample-nodejs
    contextDir: source-build
  strategy:
    kind: BuildStrategy
    name: buildpacks-v3
  output:
    image: image-registry.openshift-image-registry.svc:5000/christoph/buildpack-nodejs-build:latest
```

```yaml
apiVersion: shipwright.io/v1alpha1
kind: BuildRun
metadata:
  generateName: buildpack-nodejs-buildrun-
spec:
  buildRef:
    name: buildpack-nodejs-build
```

```yaml
apiVersion: shipwright.io/v1alpha1
kind: BuildRun
metadata:
  generateName: buildpack-nodejs-buildrun-
spec:
  buildSpec:
    source:
      url: https://github.com/shipwright-io/sample-nodejs
      contextDir: source-build
    strategy:
      kind: BuildStrategy
      name: buildpacks-v3
    output:
      image: image-registry.openshift-image-registry.svc:5000/christoph/buildpack-nodejs-build:latest
```


### Build and BuildRun (failing)

```yaml
apiVersion: shipwright.io/v1alpha1
kind: Build
metadata:
  name: strategy-not-found
spec:
  source:
    url: https://github.com/shipwright-io/sample-go.git
    contextDir: source-build
  strategy:
    kind: ClusterBuildStrategy
    name: not-found
  output:
    image: foo/bar:latest
```

```yaml
apiVersion: shipwright.io/v1alpha1
kind: BuildRun
metadata:
  generateName: strategy-not-found-
spec:
  buildRef:
    name: strategy-not-found
```

### BuildRef not found (failing)

```yaml
apiVersion: shipwright.io/v1alpha1
kind: BuildRun
metadata:
  generateName: build-not-found-
spec:
  buildRef:
    name: build-not-found
```

### asd

```yaml
apiVersion: shipwright.io/v1alpha1
kind: BuildRun
metadata:
  generateName: standalone-buildrun-
spec:
  buildSpec:
    source:
      url: https://github.com/shipwright-io/sample-go.git
      contextDir: source-build
    strategy:
      kind: ClusterBuildStrategy
      name: not-found
    output:
      image: foo/bar:latest
```

## Buildah (works fine)

Remove secret

```
apiVersion: shipwright.io/v1alpha1
kind: BuildRun
metadata:
  generateName: standalone-buildah-
spec:
  buildSpec:
    source:
      url: https://github.com/shipwright-io/sample-go.git
      contextDir: docker-build
    strategy:
      kind: ClusterBuildStrategy
      name: buildah
    output:
      image: image-registry.openshift-image-registry.svc:5000/christoph/nodeinfo-pipeline
```
