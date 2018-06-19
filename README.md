OpenShift Cluster Console
=========================


# External Service Integration Criteria

Any external service that integrates with console should satisfy the following requirements:

- The service can be installed on a 3 node cluster with 4GB of RAM per node.
- The backend will refuse to create invalid resources. (eg: CPU/RAM requests exceeding limits will result in an HTTP 400 code)
- API response time is less than 2 seconds for synchronous actions.
- Errors and statuses are propagated to the correct k8s objects for async actions.
- The service has basic documentation on debugging. (eg: How do we know if the service is working or not?)
- Nice to have: Updates to objects finish on the order of seconds, not minutes.
- Nice to have: Owned resources have ownerReferences.
- There is an agreed-upon API before any console work is started.


Codename: "Bridge"

[![Build Status](https://jenkins-tectonic.prod.coreos.systems/buildStatus/icon?job=console-build)](https://jenkins-tectonic.prod.coreos.systems/job/console-build/)

[quay.io/coreos/tectonic-console](https://quay.io/repository/coreos/tectonic-console?tab=tags)

The console is a more friendly `kubectl` in the form of a single page webapp.  It also integrates with other services like monitoring, chargeback, ALM, and identity.  Some things that go on behind the scenes include:

- Proxying the Kubernetes API under `/api/kubernetes`
- Providing additional non-Kubernetes APIs for interacting with the cluster
- Serving all frontend static assets
- User Authentication
- Some additional proxying to the Dex API

## Quickstart

### Dependencies:

1. [node.js](https://nodejs.org/) >= 8 & [yarn](https://yarnpkg.com/en/docs/install) >= 1.3.2
2. [go](https://golang.org/) >= 1.8 & [glide](https://glide.sh/) >= 0.12.0 (`go get github.com/Masterminds/glide`) & [glide-vc](https://github.com/sgotti/glide-vc)
3. [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) and a k8s cluster
4. `jq` (for `contrib/environment.sh`)
5. Google Chrome/Chromium >= 60 (needs --headless flag) for integration tests

### Build everything:

```
./build.sh
```

Backend binaries are output to `/bin`.


### Configure the application

#### Tectonic

If you have a working `kubectl` on your path, you can run the application with:

```
export KUBECONFIG=/path/to/kubeconfig
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

#### OpenShift

Registering an OpenShift OAuth client requires administrative privileges for the entire cluster, not just a local project. Run the following command to log in as cluster admin:

```
oc login -u system:admin
```

To run bridge locally connected to a remote OpenShift cluster, create an `OAuthClient` resource with a generated secret and read that secret:

```
oc process -f examples/tectonic-console-oauth-client.yaml | oc apply -f -
export OAUTH_SECRET=$( oc get oauthclient tectonic-console -o jsonpath='{.secret}' )
```

If the CA bundle of the OpenShift API server is unavailable, fetch the CA certificates from a service account secret. Otherwise copy the CA bundle to `examples/ca.crt`:

```
oc get secrets -n default --field-selector type=kubernetes.io/service-account-token -o json | \
    jq '.items[0].data."service-ca.crt"' -r | python -m base64 -d > examples/ca.crt
# Note: use "openssl base64" because the "base64" tool is different between mac and linux
```

Set the `OPENSHIFT_API` environment variable to tell the script the API endpoint:

```
export OPENSHIFT_API="https://127.0.0.1:8443"
```

Finally run the Console and visit [localhost:9000](http://localhost:9000):

```
./examples/run-bridge.sh
```

#### OpenShift (without OAuth)

For local development, you can also disable OAuth and run bridge with an
OpenShift user's access token. Run the following commands to create an admin
user and start bridge for a cluster up environment:

```
oc login -u system:admin
oc adm policy add-cluster-role-to-user cluster-admin admin
oc login -u admin
source ./contrib/oc-environment.sh
./bin/bridge
```

## Docker

The `builder-run.sh` script will run any command from a docker container to ensure a consistent build environment.
For example to build with docker run:
```
./builder-run.sh ./build.sh
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
./build-docker-push.sh
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

go, glide, glide-vc, nodejs/yarn, kubectl

### Frontend Development

All frontend code lives in the `frontend/` directory.  The frontend uses node, yarn, and webpack to compile dependencies into self contained bundles which are loaded dynamically at run time in the browser.  These bundles are not commited to git. Tasks are defined in `package.json` in the `scripts` section and are aliased to `yarn run <cmd>` (in the frontend directory).

#### Install Dependencies

To install the build tools and dependencies:
```
yarn install
```
You must run this command once, and every time the dependencies change. `node_modules` are not commited to git.

#### Interactive Development

The following build task will watch the source code for changes and compile automatically.  You must reload the page in your browser!
```
yarn run dev
```

### Tests

Run all unit tests:
```
./test.sh
```

Run backend tests:
```
./test-backend.sh
```

Run frontend tests:
```
./test-frontend.sh
```


### Integration Tests

Integration tests are run in a headless Chrome driven by [protractor](http://www.protractortest.org/#/).  Requirements include Chrome, a working cluster, kubectl, and bridge itself (see building above).

Note: If you are running integration tests against OpenShift, you should start bridge using [oc-environment.sh](#openshift-without-oauth) to skip the login page.

Setup (or any time you change node_modules - `yarn add` or `yarn install`)
```
cd frontend && yarn run webdriver-update
```

Run integration tests:
```
yarn run test-gui
```

Run integration tests on an OpenShift cluster:
```
yarn run test-gui-openshift
```
This will include the normal k8s CRUD tests and CRUD tests for OpenShift
resources. It doesn't include ALM tests since it assumes ALM is not
set up on an OpenShift cluster.


#### Hacking Integration Tests

Remove the `--headless` flag to Chrome (chromeOptions) in `frontend/integration-tests/protractor.conf.ts` to see what the tests are actually doing.

### Local Dex

Checkout and build [dex](https://github.com/coreos/dex/).

`./bin/dex serve ../../openshift/console/contrib/dex-config-dev.yaml`

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
 2. `./revendor.sh`

Update existing backend dependencies:
 1. Edit the `glide.yaml` file to the desired verison (most likely a git hash)
 2. Run `./revendor.sh`
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


#### Supported Browsers

We support the latest versions of the following browsers:

- Edge
- Chrome
- Safari
- Firefox
- TODO: IE 11. Needs polyfills. Also, IE 11 can't open more than 6 websockets.
