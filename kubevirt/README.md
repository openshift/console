This folder contains kubevirt-related
 - development documentation and notes
 - build and deployment scripts and configuration

# Other kubevirt content
```
./frontend/public/kubevirt
./frontend/__tests__/kubevirt
./frontend/public/imgs/logos/kubevirt.svg
```

# Upstream merges
The [kubevirt/web-ui](https://github.com/kubevirt/web-ui) project is fork of [openshift/console](https://github.com/openshift/console/).

Upstream changes are merged regularly using `${ROOT}/kubevirt/mergeUpstream` script to keep both projects in sync.

# Build
TBD - how to build docker image

# Development Environment
Is same as for openshift/console. See project's [README.md](https://github.com/kubevirt/web-ui/blob/master/README.md).\

# Deployment
TBD - use of kubevirt-web-ui.yaml and other configuration


# List of important patches
Kubevirt-related code lives either in separate `**/kubevirt` folders (see above) or in external projects referenced from web-ui (like [web-ui-components](https://github.com/kubevirt/web-ui-components) or [patternfly-react](https://github.com/patternfly/patternfly-react/)).

Changes to OKD code are kept at bare minimum to allow both smooth merges or recomposing the UI within another application in the future.

## Full list of changes compared to upstream:
```
git remote add openshift_console https://github.com/openshift/console.git
git remote add kubevirt_web_ui https://github.com/kubevirt/web-ui.git
git fetch --all
git log remotes/openshift_console/master..remotes/kubevirt_web_ui/master
```

## List of important OKD-core changes: 
 - https://github.com/kubevirt/web-ui/pull/1

 
