# Tectonic

This repo contains all projects in Tectonic stack. Provisioners, installers, and on-cluster services.

Exceptions are the following repos which are also maintained by the Tectonic engineering team:
- [coreos/dex](https://github.com/coreos/dex) AKA Tectonic Identity
- [coreos-inc/bridge](https://github.com/coreos-inc/bridge) AKA Tectonic Console
- [coreos-inc/roller](https://github.com/coreos-inc/roller) AKA CoreUpdate

## Documentation

Everything in the `Documentation` directory is meant for public consumption and is synced to the public tectonic.com website.
Nothing else in this repo should be exposed publicly.

The [coreos-inc/tectonic-pages](https://github.com/coreos-inc/tectonic-pages) repo holds the source of our public-facing [tectonic.com](https://tectonic.com) website.
The pure documentation for the website is synced from [coreos-inc/tectonic](https://github.com/coreos-inc/tectonic) on-demand, while blog posts and static pages are developed directly in [coreos-inc/tectonic-pages](https://github.com/coreos-inc/tectonic-pages).

All private internal docs, intended only for CoreOS employees and engineers, should go in `docs-internal`.

### Install Guides

This repo contains two primary guides:

- [Deployer Guide](Documentation/enterprise/deployer/index.md): deploy Tectonic on AWS; initialize a new cluster
- [End-User Guide](Documentation/enterprise/end-user/index.md): configure local tools to work with Tectonic

## Engineering Projects

Installing Tectonic consists of multiple phases, built in separate systems with their own independent build systems, dependencies, etc.
All components are designed to interact seamlessly without the end user needing to be aware of this separation.

* Phase 1, [bootstrap](bootstrap/README.md): A bare-metal Kubernetes cluster provisioner, which consists of a GUI installer and a robust Go backend. It manages first boot, operating system install, and setup of bare-bones Kubernetes components.
* Phase 2, [wiz](wiz/README.md): A GUI web app that runs in the Kubernetes cluster. It guides the user through a wizard-like setup flow to collect configuration information required for Tectonic.
* Phase 3, [manager](manager/README.md): A headless services that runs in the Kubernetes cluster. It consumes config data provided by Wiz and deploys the necessary Tectonic services.

Each project has it's own build and test scripts which should match the structure below. From the root directory you can build or test all sub projects.

### Build

Building the tectonic project requires

* Go version 1.6
* node version 5.6 and npm version 2
* jq
* sed

Because these versions may change, even between different branches of the project, the recommended way to track and install tool versions is with the tools `nvm` and `gvm`.

    https://github.com/moovweb/gvm
    https://github.com/creationix/nvm

You can install the relevant versions of go with

```
gvm listall
gvm install YOUR_FAVORITE_VERSION
gvm use YOUR_FAVORITE_VERSION
```

Similarly, you can install the relevant versions of node and npm with

```
nvm ls-remote
nvm install YOUR_FAVORITE_VERSION
nvm use YOUR_FAVORITE_VERSION
```

Once node is installed and in use in your shell, update npm with

```
npm install -g npm@2
```


You can build all projects by running:

    ./build

### Tests

You can test all projects by running:

    ./test

### CI (Jenkins)

All CI related scripting exists in the root and can be run with the jenkins script:

    ./jenkins`

### Subproject Builds

Similarly each sub-project has corresponding `build` and `test` scripts that can be run independently from the entire repository

### Service Ports:

The following is a list of services and the node ports we expose those services
on:

- tectonic-console: 32000
- tectonic-identity-worker: 32001
- tectonic-wizard: 32002
- tectonic-manager: 32003
- grafana: 32004
- prometheus: 32005

