# OpenShift Console

Codename: "Bridge"

[quay.io/openshift/origin-console](https://quay.io/repository/openshift/origin-console?tab=tags)

The console is a more friendly `kubectl` in the form of a single page webapp. It also integrates with other services like monitoring, chargeback, and OLM. Some things that go on behind the scenes include:

- Proxying the Kubernetes API under `/api/kubernetes`
- Providing additional non-Kubernetes APIs for interacting with the cluster
- Serving all frontend static assets
- User Authentication

## Quickstart

### Dependencies:

1. [node.js](https://nodejs.org/) >= 18 & [yarn](https://yarnpkg.com/en/docs/install) >= 1.20
2. [go](https://golang.org/) >= 1.18+
3. [oc](https://mirror.openshift.com/pub/openshift-v4/clients/oc/4.4/) or [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) and an OpenShift or Kubernetes cluster
4. [jq](https://stedolan.github.io/jq/download/) (for `contrib/environment.sh`)
5. Google Chrome/Chromium or Firefox for integration tests

### Build everything:

This project uses [Go modules](https://github.com/golang/go/wiki/Modules),
so you should clone the project outside of your `GOPATH`. To build both the
frontend and backend, run:

```
./build.sh
```

Backend binaries are output to `./bin`.

### Configure the application

The following instructions assume you have an existing cluster you can connect
to. OpenShift 4.x clusters can be installed using the
[OpenShift Installer](https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/). More information about installing OpenShift can be found at
<https://try.openshift.com/>.
You can also use [CodeReady Containers](https://github.com/code-ready/crc)
for local installs, or native Kubernetes clusters.

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

#### Enabling Monitoring Locally
In order to enable the monitoring UI and see the "Observe" navigation item while running locally, you'll need to run the OpenShift Monitoring dynamic plugin alongside Bridge. To do so, follow these steps:

1. Clone the monitoring-plugin repo: https://github.com/openshift/monitoring-plugin
2. `cd` to the monitoring-plugin root dir
3. Run
  ```
  yarn && yarn start
  ```
4. Run Bridge in another terminal following the steps above, but set the following environment variable before starting Bridge:
  ```
  export BRIDGE_PLUGINS="monitoring-plugin=http://localhost:9001"
  ```

#### Updating `tectonic-console-builder` image
Updating `tectonic-console-builder` image is needed whenever there is a change in the build-time dependencies and/or go versions.

In order to update the `tectonic-console-builder` to a new version i.e. v27, follow these steps:

1. Update the `tectonic-console-builder` image tag in files listed below:
   - .ci-operator.yaml
   - Dockerfile.dev
   - Dockerfile.plugins.demo
   For example, `tectonic-console-builder:27`
2. Update the dependencies in Dockerfile.builder file i.e. v18.0.0.
3. Run `./push-builder.sh` script build and push the updated builder image to quay.io.
   Note: You can test the image using `./builder-run.sh ./build-backend.sh`.
   To update the image on quay.io, you need edit permission to the quay.io/coreos/  tectonic-console-builder repo. 
4. Lastly, update the mapping of `tectonic-console-builder` image tag in 
   [openshift/release](https:// github.com/openshift/release/blob/master/core-services/image-mirroring/supplemental-ci-images/mapping_supplemental_ci_images_ci) repository. 
   Note: There could be scenario were you would have to add the new image reference in the "mapping_supplemental_ci_images_ci" file, i.e. to avoid CI downtime for upcoming release cycle. 
   Optional: Request for the [rhel-8-base-nodejs-openshift-4.15](https://github.com/openshift-eng/ocp-build-data/pull/3775/files) nodebuilder update if it doesn't match the node version in `tectonic-console-builder`.

#### CodeReady Containers

If you want to use CodeReady for local development, first make sure [it is set up](https://crc.dev/crc/#setting-up-codeready-containers_gsg), and the [OpenShift cluster is started](https://crc.dev/crc/#starting-the-virtual-machine_gsg).

To login to the cluster's API server, you can use the following command:

```shell
oc login -u kubeadmin -p $(cat ~/.crc/machines/crc/kubeadmin-password) https://api.crc.testing:6443
```

&hellip; or, alternatively, use the CRC daemon UI (*Copy OC Login Command --> kubeadmin*) to get the cluster-specific command.

Finally, prepare the environment, and run the console:

```shell
source ./contrib/environment.sh
./bin/bridge
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

Use this token value to set the `BRIDGE_K8S_AUTH_BEARER_TOKEN` environment variable when running Bridge.

## Operator

In OpenShift 4.x, the console is installed and managed by the
[console operator](https://github.com/openshift/console-operator/).

## Hacking

See [CONTRIBUTING](CONTRIBUTING.md) for workflow & convention details.

See [STYLEGUIDE](STYLEGUIDE.md) for file format and coding style guide.

### Dev Dependencies

go 1.18+, nodejs/yarn, kubectl

### Frontend Development

All frontend code lives in the `frontend/` directory. The frontend uses node, yarn, and webpack to compile dependencies into self contained bundles which are loaded dynamically at run time in the browser. These bundles are not committed to git. Tasks are defined in `package.json` in the `scripts` section and are aliased to `yarn run <cmd>` (in the frontend directory).

#### Install Dependencies

To install the build tools and dependencies:

```
cd frontend
yarn install
```

You must run this command once, and every time the dependencies change. `node_modules` are not committed to git.

#### Interactive Development

The following build task will watch the source code for changes and compile automatically.
If you would like to disable hot reloading, set the environment variable `HOT_RELOAD` to `false`.

```
yarn run dev
```

If changes aren't detected, you might need to increase `fs.inotify.max_user_watches`. See <https://webpack.js.org/configuration/watch/#not-enough-watchers>. If you need to increase your watchers, it's common to see multiple errors beginning with `Error from chokidar`.

### Unit Tests

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

#### Debugging Unit Tests

1. `cd frontend; yarn run build`
2. Add `debugger;` statements to any unit test
3. `yarn debug-test route-pages`
4. Chrome browser URL: 'chrome://inspect/#devices', click on the 'inspect' link in **Target (v10...)** section.
5. Launches chrome-dev tools, click Resume button to continue
6. Will break on any `debugger;` statements

### Integration Tests

Cypress integration tests are implemented in [Cypress.io](https://www.cypress.io/).

To install Cypress:

```
cd frontend
yarn run cypress install
```

Launch Cypress test runner:

```
cd frontend
oc login ...
yarn run test-cypress-console
```

This will launch the Cypress Test Runner UI in the `console` package, where you can run one or all Cypress tests.

**Important:**  when testing with authentication, set `BRIDGE_KUBEADMIN_PASSWORD` environment variable in your shell.

#### Execute Cypress in different packages

An alternate way to execute cypress tests is via [test-cypress.sh](test-cypress.sh) which takes a `-p <package>` parameter to allow execution in different packages. It also can run Cypress tests in the Test Runner UI or in `-- headless` mode:

```
console>./test-cypress.sh
Runs Cypress tests in Test Runner or headless mode
Usage: test-cypress [-p] <package> [-s] <filemask> [-h true]
  '-p <package>' may be 'console, 'olm' or 'devconsole'
  '-s <specmask>' is a file mask for spec test files, such as 'tests/monitoring/*'. Used only in headless mode when '-p' is specified.
  '-h true' runs Cypress in headless mode. When omitted, launches Cypress Test Runner
Examples:
  test-cypress.sh                                       // displays this help text
  test-cypress.sh -p console                            // opens Cypress Test Runner for console tests
  test-cypress.sh -p olm                                // opens Cypress Test Runner for OLM tests
  test-cypress.sh -h true                               // runs all packages in headless mode
  test-cypress.sh -p olm -h true                        // runs OLM tests in headless mode
  test-cypress.sh -p console -s 'tests/crud/*' -h true  // runs console CRUD tests in headless mode
```

When running in headless mode, Cypress will test using its integrated Electron browser, but if you want to use Chrome or Firefox instead, set `BRIDGE_E2E_BROWSER_NAME` environment variable in your shell with the value `chrome` or `firefox`.

[**_More information on Console's Cypress usage_**](frontend/packages/integration-tests-cypress/README.md)

[**_More information on DevConsole's Cypress usage_**](frontend/packages/dev-console/integration-tests/README.md)

#### How the Integration Tests Run in CI

The end-to-end tests run against pull requests using [ci-operator](https://github.com/openshift/ci-operator/).
The tests are defined in [this manifest](https://github.com/openshift/release/blob/master/ci-operator/jobs/openshift/console/openshift-console-master-presubmits.yaml)
in the [openshift/release](https://github.com/openshift/release) repo and were generated with [ci-operator-prowgen](https://github.com/openshift/ci-operator-prowgen).

CI runs the [test-prow-e2e.sh](test-prow-e2e.sh) script, which runs [test-cypress.sh](test-cypress.sh).

[test-cypress.sh](test-cypress.sh) runs all Cypress tests, in all 'packages' (console, olm, and devconsole), in `-- headless` mode via:

`test-cypress.sh -h true`

For more information on `test-cypress.sh` usage please see [Execute Cypress in different packages](#execute-cypress-in-different-packages)

### Internationalization

See [INTERNATIONALIZATION](INTERNATIONALIZATION.md) for information on our internationalization tools and guidelines.

### Deploying a Custom Image to an OpenShift Cluster

Once you have made changes locally, these instructions will allow you to push
changes to an OpenShift cluster for others to review. This involves building a
local image, pushing the image to an image registry, then updating the
OpenShift cluster to pull the new image.

#### Prerequisites

1. Docker v17.05 or higher for multi-stage builds
2. An image registry like [quay.io](https://quay.io/signin/) or [Docker Hub](https://hub.docker.com/)

#### Steps

1. Create a repository in the image registry of your choice to hold the image.
2. Build Image `docker build -t <your-image-name> <path-to-repository | url>`. For example:

```
docker build -t quay.io/myaccount/console:latest .
```

3. Push image to image registry `docker push <your-image-name>`. Make sure
   docker is logged into your image registry! For example:

```
docker push quay.io/myaccount/console:latest
```

4. Put the console operator in unmanaged state:

```
oc patch consoles.operator.openshift.io cluster --patch '{ "spec": { "managementState": "Unmanaged" } }' --type=merge
```

5. Update the console Deployment with the new image:

```
oc set image deploy console console=quay.io/myaccount/console:latest -n openshift-console
```

6. Wait for the changes to rollout:

```
oc rollout status -w deploy/console -n openshift-console
```

You should now be able to see your development changes on the remote OpenShift cluster!

When done, you can put the console operator back in a managed state to remove the custom image:

```
oc patch consoles.operator.openshift.io cluster --patch '{ "spec": { "managementState": "Managed" } }' --type=merge
```

### Dependency Management

Dependencies should be pinned to an exact semver, sha, or git tag (eg, no ^).

#### Backend

Whenever making vendor changes:

1. Finish updating dependencies & writing changes
2. Commit everything _except_ `vendor/` (eg, `server: add x feature`)
3. Make a second commit with only `vendor/` (eg, `vendor: revendor`)

Adding new or updating existing backend dependencies:

1.  Edit the `go.mod` file to the desired version (most likely a git hash)
2.  Run `go mod tidy && go mod vendor`
3.  Verify update was successful. `go.sum` will have been updated to reflect the changes to `go.mod` and the package will have been updated in `vendor`.

#### Frontend

Add new frontend dependencies:

```
yarn add <package@version>
```

Update existing frontend dependencies:

```
yarn upgrade <package@version>
```

To upgrade yarn itself, download a new yarn release from
<https://github.com/yarnpkg/yarn/releases>, replace the release in
`frontend/.yarn/releases` with the new version, and update `yarn-path` in
`frontend/.yarnrc`.

##### @patternfly

Note that when upgrading @patternfly packages, we've seen in the past that it can cause the JavaScript heap to run out of memory, or the bundle being too large if multiple versions of the same @patternfly package is pulled in. To increase efficiency, run the following after updating packages:

```
npx yarn-deduplicate --scopes @patternfly
```

#### Supported Browsers

We support the latest versions of the following browsers:

- Edge
- Chrome
- Safari
- Firefox

IE 11 and earlier is not supported.

## Frontend Packages
- [console-dynamic-plugin-sdk](./frontend/packages/console-dynamic-plugin-sdk/README.md)
[[API]](./frontend/packages/console-dynamic-plugin-sdk/docs/api.md)
[[Console Extensions]](./frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md)

- [console-plugin-shared](./frontend/packages/console-plugin-shared/README.md)

- [dev-console](./frontend/packages/dev-console/README.md)

- [eslint-plugin-console](./frontend/packages/eslint-plugin-console/README.md)

- [integration-tests-cypress](./frontend/packages/integration-tests-cypress/README.md)

- [knative-plugin](./frontend/packages/knative-plugin/README.md)

- operator-lifecycle-manager
[[Descriptors README]](./frontend/packages/operator-lifecycle-manager/src/components/descriptors/README.md)
[[Descriptors API Reference]](./frontend/packages/operator-lifecycle-manager/src/components/descriptors/reference/reference.md)

- [rhoas-plugin](./frontend/packages/rhoas-plugin/README.md)
