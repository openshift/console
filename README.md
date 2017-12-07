Tectonic Console
================

Codename: "Bridge"

[![Build Status](https://jenkins-tectonic.prod.coreos.systems/buildStatus/icon?job=console-build)](https://jenkins-tectonic.prod.coreos.systems/job/console-build/)

[quay.io/coreos/tectonic-console](https://quay.io/repository/coreos/tectonic-console?tab=tags)

Console consists of a frontend webapp and a backend service which serves the following purposes:
- Proxy the Kubernetes API
- Provide additional non-Kubernetes APIs for interacting with the cluster
- Serve all frontend static assets
- User Authentication
- Some additional proxying to the Dex API

## Quickstart

### Deps:

1. nodejs >= 6.0 & yarn >= 0.23.1 (use of nvm is recommended)
2. go >= 1.8 & glide >= 0.12.0
3. [kubectl](http://kubernetes.io/docs/getting-started-guides/binary_release/#prebuilt-binary-release)

### Build everything:

```
./build
```

Backend binaries are output to `/bin`.


### Configure the application

If you've got a working `kubectl` on your path, you can run the application with

```
source ./contrib/environment.sh
./bin/bridge
```

The script in `contrib/environment.sh` sets sensible defaults in the environment, and uses `kubectl` to query your cluster for endpoint and authentication information.

To configure the application to run by hand, (or if `environment.sh` doesn't work for some reason) you can manually provide a Kubernetes bearer token with the following steps.

First get the secret ID that has a type of `kubernetes.io/service-account-token` by running:
```
kubectl get secrets
```

then get the secret contents:
```
kubectl describe secrets/<secret-id-obtained-previously>
```

Use this token value to set the `BRIDGE_K8S_BEARER_TOKEN` environment variable when running Bridge.

## Docker

The `builder-run` script will run any command from a docker container to ensure a consistent build environment.
For example to build with docker run:
```
./builder-run ./build
```

The docker image used by builder-run is itself built and pushed by the
script `push-builder`, which uses the file `Dockerfile-builder` to
define an image. To update the builder-run build environment, first make
your changes to `Dockerfile-builder`, then run `push-builder`, and
then update the BUILDER_VERSION variable in `builder-run` to point to
your new image. Our practice is to manually tag images builder images in the form
`Builder-v$SEMVER` once we're happy with the state of the push.

### Compile, Build, & Push Docker Image

(Almost no reason to ever do this manually, Jenkins handles this automation)

Build a docker image, tag it with the current git sha, and pushes it to the `quay.io/coreos/tectonic-console` repo.

Must set env vars `DOCKER_USER` and `DOCKER_PASSWORD` or have a valid `.dockercfg` file.
```
./build-docker-push
```

### Jenkins automation

Master branch:

* Runs a build, pushes an image to Quay tagged with the commit sha

Pull requests:

* Runs a build when PRs are created or PR commits are pushed
* Comment with `Jenkins rebuild` to manually trigger a re-build
* Comment with `Jenkins push` to push an image to Quay, tagged with:
    `pr_[pr #]_build_[jenkins build #]`

If changes are ever required for the Jenkins job configuration, apply them to both the [regular console job](https://jenkins-tectonic.prod.coreos.systems/job/console-build/) and [PR image job](https://jenkins-tectonic.prod.coreos.systems/job/console-pr-image/).

## Hacking

See [CONTRIBUTING](CONTRIBUTING.md) for workflow & convention details.

See [STYLEGUIDE](STYLEGUIDE.md) for file format and coding style guide.

### Dev Dependencies

go, glide, nodejs/yarn, kubectl

### Frontend Development

All frontend tasks are defined in `/frontend/package.json` and are aliased to `yarn run <cmd>`

#### Install Dependencies

The frontend uses node and yarn to compile JS/JSX at build time. To install the build tools and dependencies:
```
yarn install
```

JS is compiled into one of two bundles - one strictly for external dependencies and the other for our source.  These bundles are not commited to git.  You must run this command once, and every time the dependencies change.

#### Interactive Development

The following build task will watch the source code for changes and compile automatically.  You must reload the page!
```
yarn run dev
```

### Tests

Run all tests:
```
./test
```

Run backend tests:
```
./test-backend
```

Run frontend tests:
```
./test-frontend
```

#### Local Dex

Checkout and build [dex](https://github.com/coreos/dex/).

`./bin/dex serve ../../coreos-inc/bridge/contrib/dex-config-dev.yaml`

Run bridge with the following options:

```
./bin/bridge \
  --user-auth=oidc \
  --user-auth-oidc-issuer-url='http://127.0.0.1:5556' \
  --user-auth-oidc-client-id='example-app' \
  --user-auth-oidc-client-secret='ZXhhbXBsZS1hcHAtc2VjcmV0' \
  --base-address='http://localhost:9000/' \
  --kubectl-client-id='example-app' \
  --kubectl-client-secret='ZXhhbXBsZS1hcHAtc2VjcmV0'
```


### Dependency Management

Dependencies should be pinned to an exact semver, sha, or git tag (eg, no ^).

#### Backend

Whenever making vendor changes:
1. Finish updating dependencies & writing changes
2. Commit everything *except* `vendor/` (eg, `server: add x feature`)
3. Make a second commit with only `vendor/` (eg, `vendor: revendor`)

Add new backend dependencies:
 1. Edit `glide.yaml`
 2. `glide update -v`

Update existing backend dependencies:
 1. Edit the `glide.yaml` file to the desired verison (most likely a git hash)
 2. Run `glide update -u github.com/$ORG/$REPO`
 3. Verify update was successful. `glide.lock` will have been updated to reflect the changes to `glide.yaml` and the package will have been updated in `vendor`.

#### Frontend

Add new frontend dependencies:
```
yarn add <package@version>
```

Update existing frontend dependencies:
```
yarn upgrade <package@version>
```
