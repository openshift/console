Bridge
======

[![Build Status](https://jenkins-tectonic.prod.coreos.systems/buildStatus/icon?job=console-build)](https://jenkins-tectonic.prod.coreos.systems/job/console-build/)

The Tectonic Console

[quay.io/coreos/tectonic-console](https://quay.io/repository/coreos/tectonic-console?tab=tags)

Bridge consists of a frontend webapp and a backend service which serves the following purposes:
- Proxy the Kubernetes API
- Provide additional non-Kubernetes APIs for interacting with the cluster
- Serve all frontend static assets
- User Authentication (TBD)

## Quickstart

### Deps:

1. nodejs >= 6.0 (>=4 will probably work)
2. npm >= 3 (probably installed with node)
3. go >= 1.6

### Build everything:
```
./build
```

Backend binaries are output to `/bin`.


### Configure the application to run

If you've got a working `kubectl` on your path, you can run the application with

```
source ./contrib/environment.sh
./bin/bridge
```

The script in `contrib/environment.sh` sets sensible defaults in the environment, and uses `kubectl` to query your cluster for endpoint and authentication information.

To configure the application to run by hand, (or if `enironment.sh` doesn't work for some reason) you can manually provide a Kubernetes bearer token with the following steps.

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
Build a docker image, tag it with the current git sha, and pushes it to the `quay.io/coreos/tectonic-console` repo.

Must set env vars `DOCKER_USER` and `DOCKER_PASSWORD` or have a valid `.dockercfg` file.
```
./build-docker-push
```

## Hacking
### Project Dependencies
go, glide, nodejs, gulp

### Frontend
For interactive frontend development compiling html templates and sass is required.
The following build task will watch the source code for changes and compile automatically:
```
npm run dev
```

All frontend build tasks are defined in `/frontend/gulpfile.js`

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

### Dependency Management
Add new frontend dependencies:
 1. `npm install --save` the dependency
 2. commit the altered `package.json`

Add new backend dependencies:
 1. Edit glide.yaml
 2. `glide update -s -v -u`

### API Schema
If changes are made to the `schema/v1.json` file you must regenerate the go bindings:
```
./schema/generator
```
