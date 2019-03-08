OpenShift Console
=========================

Codename: "Bridge"

[quay.io/openshift/origin-console](https://quay.io/repository/openshift/origin-console?tab=tags)

The console is a more friendly `kubectl` in the form of a single page webapp.  It also integrates with other services like monitoring, chargeback, and OLM.  Some things that go on behind the scenes include:

- Proxying the Kubernetes API under `/api/kubernetes`
- Providing additional non-Kubernetes APIs for interacting with the cluster
- Serving all frontend static assets
- User Authentication

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

The following instructions assume you have an existing cluster you can connect
to. OpenShift 4.0 clusters can be installed using the
[OpenShift Installer](https://github.com/openshift/installer).
You can also use [CodeReady Containers](https://github.com/code-ready/osp4)
for local installs. More information about installing OpenShift can be found at
<https://try.openshift.com/>.


#### OpenShift (no authentication)

For local development, you can disable OAuth and run bridge with an OpenShift
user's access token. If you've installed OpenShift 4.0, run the following
commands to login as the kubeadmin user and start a local console for
development. Make sure to replace `/path/to/install-dir` with the directory you
used to install OpenShift.

```
oc login -u kubeadmin -p $(cat /path/to/install-dir/auth/kubeadmin-password)
source ./contrib/oc-environment.sh
./bin/bridge
```

The console will be running at [localhost:9000](http://localhost:9000).

If you don't have `kubeadmin` access, you can use any user's API token,
although you will be limited to that user's access and might not be able to run
the full integration test suite.

#### OpenShift (with authentication)

If you need to work on the backend code for authentication or you need to test
different users, you can set up authentication in your development environment.
Registering an OpenShift OAuth client requires administrative privileges for
the entire cluster, not just a local project. You must be logged in as a
cluster admin such as `system:admin` or `kubeadmin`.

To run bridge locally connected to an OpenShift cluster, create an
`OAuthClient` resource with a generated secret and read that secret:

```
oc process -f examples/console-oauth-client.yaml | oc apply -f -
oc get oauthclient console-oauth-client -o jsonpath='{.secret}' > examples/console-client-secret
```

If the CA bundle of the OpenShift API server is unavailable, fetch the CA
certificates from a service account secret. Otherwise copy the CA bundle to
`examples/ca.crt`:

```
oc get secrets -n default --field-selector type=kubernetes.io/service-account-token -o json | \
    jq '.items[0].data."ca.crt"' -r | python -m base64 -d > examples/ca.crt
# Note: use "openssl base64" because the "base64" tool is different between mac and linux
```

Finally run the console and visit [localhost:9000](http://localhost:9000):

```
./examples/run-bridge.sh
```

#### Native Kubernetes

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

## Operator

In OpenShift 4.x, the console is installed and managed by the
[console operator](https://github.com/openshift/console-operator/).

## Hacking

See [CONTRIBUTING](CONTRIBUTING.md) for workflow & convention details.

See [STYLEGUIDE](STYLEGUIDE.md) for file format and coding style guide.

### Dev Dependencies

go, glide, glide-vc, nodejs/yarn, kubectl

### Frontend Development

All frontend code lives in the `frontend/` directory.  The frontend uses node, yarn, and webpack to compile dependencies into self contained bundles which are loaded dynamically at run time in the browser.  These bundles are not committed to git. Tasks are defined in `package.json` in the `scripts` section and are aliased to `yarn run <cmd>` (in the frontend directory).

#### Install Dependencies

To install the build tools and dependencies:
```
yarn install
```
You must run this command once, and every time the dependencies change. `node_modules` are not committed to git.

To install dependencies for the backend:

```
glide update --strip-vendor
```

#### Interactive Development

The following build task will watch the source code for changes and compile automatically.  You must reload the page in your browser!
```
yarn run dev
```
If changes aren't detected, you might need to increase `fs.inotify.max_user_watches`. See <https://webpack.js.org/configuration/watch/#not-enough-watchers>.

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
resources.

#### How the Integration Tests Run in CI

The end-to-end tests run against pull requests using [ci-operator](https://github.com/openshift/ci-operator/).
The tests are defined in [this manifest](https://github.com/openshift/release/blob/master/ci-operator/jobs/openshift/console/openshift-console-master-presubmits.yaml)
in the [openshift/release](https://github.com/openshift/release) repo and were generated with [ci-operator-prowgen](https://github.com/openshift/ci-operator-prowgen).

CI runs the [test-prow-e2e.sh](test-prow-e2e.sh) script, which uses the `e2e` suite defined in [protractor.conf.ts](frontend/integration-tests/protractor.conf.ts).

You can simulate an e2e run against an existing 4.0 cluster with the following commands (replace `/path/to/install-dir` with your OpenShift 4.0 install directory):

```
$ export BRIDGE_AUTH_USERNAME=kubeadmin
$ export BRIDGE_BASE_ADDRESS="https://$(oc get route console -n openshift-console -o jsonpath='{.spec.host}')"
$ export BRIDGE_AUTH_PASSWORD=$(cat "/path/to/install-dir/auth/kubeadmin-password")
$ ./test-gui.sh e2e
```

If you don't want to run the entire e2e tests, you can use a different suite from [protractor.conf.ts](frontend/integration-tests/protractor.conf.ts). For instance,

```
$ ./test-gui.sh olm
```

#### Hacking Integration Tests

Remove the `--headless` flag to Chrome (chromeOptions) in [protractor.conf.ts](frontend/integration-tests/protractor.conf.ts) to see what the tests are actually doing.

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
 1. Edit the `glide.yaml` file to the desired version (most likely a git hash)
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

IE 11 and earlier is not supported.
