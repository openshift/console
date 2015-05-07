Bridge
======
The Tectonic Console

[![Build Status](https://semaphoreci.com/api/v1/projects/eb020f87-c196-4b58-8149-f04fafc2de07/411974/badge.svg)](https://semaphoreci.com/coreos-inc/bridge)

[quay.io/coreos/tectonic-console](https://quay.io/repository/coreos/tectonic-console?tab=tags)


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
./bin/bridge
```

## Docker
The `go-docker` script will run any command from a docker container to ensure a consistent build environment.
For example to build with docker run:
```
./go-docker ./build
```

### Compile, Build, & Push Docker Image
Build a docker image, tag it with the current git sha, and pushes it to the `quay.io/coreos/tectonic-console` repo.

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
