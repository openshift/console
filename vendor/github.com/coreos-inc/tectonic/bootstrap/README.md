# Tectonic Installer Bootstrap

The tectonic installer bootstrap is a tool for initializing a
Kubernetes cluster to the point where the Wiz configuration system can
be installed and run on a Kubernetes cluster.

## Usage

Follow the [developer guide](../Documentation/developer-usage.md) to do an end-to-end Tectonic cluster setup.

## Build and Run

See the [global project README](../README.md) for tool requirements and versions.

Run the `all` script to build from sources.

    cd $GOPATH/src/github.com/coreos-inc/tectonic/bootstrap
    ./all

If you run ./all from a directory not on your $GOPATH (perhaps because you've added a symlink to your GOPATH) the script will fail in nonsensical ways.

When successful, running `./all` will result in the production of a binary, `./bin/bootstrap`, that you can use to run the bootstrap tool. All assets are contained in this binary, it can be distributed and run without any other files.

Running `./bin/bootstrap` requires a running `bootcfg`. See the [bootcfg section](../docs-internal/developer-usage.md#coreos-baremetal) for information about setting up a bootcfg service.

## Development Features

The build also produces a development binary, `./bin/devstrap`, that has additional command line options useful for development. You can see these options by looking at the source code in `devcmd/main.go`, or by running

    ./bin/devstrap -help

At times during development or testing, it can be convenient to pre-fill values in the bootstrap UI. You can do this in your browser by opening the Javascript development console and running `DEBUG_prefill()`

If your work doesn't require UI interaction to test, you can use `curl` to POST example data from `examples` directly to the server with

    ./bin/devstrap &
    curl -H "Content-Type: application/json" -X POST -d @examples/bootkube.json http://127.0.0.1:4444/cluster/create

The `devstrap` binary can be run with an `-asset-dir` flag, which will serve assets directly from a local directory of your choice. The front end asset build system has a watch on change mode that will build new assets as changes are made to source files, and deposit the build results in `./dev`. Using both of these capabilities together can make UI development a bit more convenient

    ./bin/bootstrap -asset-dir ./dev &
    pushd frontend/ && npm run dev

## Managing Dependencies

### Frontend

Dependencies are managed with npm and browserify. Unlike go
dependencies, npm dependencies are *not* vendored directly, because
`npm install` will build native extensions that could break builds on
other platforms/operating systems. To add a dependency, run:

    cd $GOPATH/src/github.com/coreos-inc/tectonic/bootstrap/frontend
    npm install --save $MY_PACKAGE # for a runtime dependency
    npm shrinkwrap --dev

If you are adding a build dependency, run the following commands instead:

    cd $GOPATH/src/github.com/coreos-inc/tectonic/bootstrap/frontend
    npm install --save-dev $MY_BUILD_PACKAGE # for a development dependency
    npm shrinkwrap --dev

Both sets of commands will update the `package.json` and
`npm-shrinkwrap.json` files in the repository - those changes should
then be committed.

### Go

Dependencies are managed with [glide](https://glide.sh/), but committed directly to the repository. To add a new dependency:

- Edit the `glide.yaml` file to add your dependency.
- Ensure you add a `version` field for the sha or tag you want to pin to.
- Run glide to update the vendor source directory

To run glide, use the following commands. All three command line options, `--update-vendored`, `--strip-vendor` and `--strip-vcs` are required.

    cd $GOPATH/src/github.com/coreos-inc/tectonic/bootstrap
    glide update --update-vendored --strip-vendor --strip-vcs

If it worked correctly it should:
- Clone your new dep to the `/vendor` dir, and check out the ref you specified.
- Update `glide.lock` to include your new package, adds any transitive dependencies, and updates its hash.

For the sake of your fellow reviewers, commit vendored code changes as a separate commit from any other changes.

#### Regenerate or Repair Vendored Code

Should you need to regenerate or repair the vendored code en-mass from their source repositories, you can run:

    rm -rf vendor/
    glide install --strip-vendor --strip-vcs

