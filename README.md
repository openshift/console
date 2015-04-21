Bridge
======
The Tectonic Console

[![Build Status](https://semaphoreci.com/api/v1/projects/38fb8e53-cc69-4f92-832c-a6608874577a/404574/badge.svg)](https://semaphoreci.com/coreos-inc/bridge)


Bridge consists of a frontend webapp and a backend service which serves the following purposes:
- Proxy the Kubernetes API
- Provide additional non-Kubernetes APIs for interacting with the cluster
- Serve all frontend static assets
- User Authentication (TBD)


## Quickstart

Build the backend:
```
./build
```
Backend binaries are output to `/bin`.

Build and package all frontent assets for deployment:
```
./build-web
```
Frontend build assets are output to: `/frontend/public/dist`.

Start the application:
```
./bin/bridge --k8s-endpoint=http://<kubernetes-api-host>:8080 \
    --k8s-api-service=<fleet-unit-name> \
    --k8s-controller-manager-service=<fleet-unit-name> \
    --k8s-scheduler-service=<fleet-unit-name> \
    --etcd-endpoints=http://<etcd-host>:7001
```

## Docker

### Compile Code with a Container
As a convenience, this script will compile the source using a docker container if a local Go compiler is unavailable.
```
./build-docker
```

### Compile & Build Docker Image
```
./build-docker
docker build .
```

### Compile, Build, & Push Docker Image
After compiling code and building a docker image, this additionally pushes the resulting image to the `quay.io/coreosinc/bridge` repository and tags it with the current git sha.

Must set env vars `DOCKER_USER` and `DOCKER_PASSWORD` or have a valid `.dockercfg` file.
```
./build-docker-push
```

## Hacking

### Project Dependencies
go, godep, nodejs, gulp

### Frontend
For interactive frontend development compiling html templates and sass is required.
The following build task will watch the source code for changes and compile automatically:
```
gulp dev
```
If gulp is not installed, install with `npm install -g gulp`.
All frontend build tasks are defined in `/frontend/gulpfile.js`

### Tests
Run backend tests:
```
./test
```

Run frontend tests:
```
./test-web
```

### Dependency Management
Add new frontend dependencies:
 1. `bower install` the dependency
 2. From `/frontend` run `gulp deps`
 3. Add and commit generated `deps.js` and `deps.min.js` files in `/frontend/public/lib/`

Add new backend dependencies:
 1. `go get ...` as usual
 2. run `godep save ./...`

Update existing backend dependencies:
 1. `go get -u foo/bar` as usual
 2. `godep update foo/bar`

### API Schema
If changes are made to the `schema/v1.json` file you must regenerate the go bindings:
```
./schema/generator
```
