# Release Guide

This guide covers releasing new versions of Tectonic Console.

## Version

Decide on an incremented release semantic $VERSION.

## Docs

Add changes to the [changelog](https://github.com/openshift/console/blob/master/CHANGES.md) for the new version.
Make note of any newly introduced known issues, breaking changes or removed features.

## Tag

Tag a commit, sign the tag, and push it to Github.

```
git tag -s $VERSION -m "$VERSION"
git push origin --tags
```

[Jenkins](https://jenkins-tectonic.prod.coreos.systems/job/console-build/build?delay=0sec) should have already built and pushed an image for every sha merged into master.
Manually pull the docker image tagged with the sha that corresponds to the new version tag and manually push the image to [quay.io/coreos/tectonic-console](https://quay.io/repository/coreos/tectonic-console).

TODO: this should happen in jenkins automatically for tag builds (like github.com/coreos-inc/tectonic).

```
docker pull quay.io/coreos/tectonic-console:$SHA
docker tag quay.io/coreos/tectonic-console:$SHA quay.io/coreos/tectonic-console:$VERSION
docker push quay.io/coreos/tectonic-console:$VERSION
```

## Github

Create a [release](https://github.com/openshift/console/releases) on Github with release notes by copying the changelog.

## Update Installer

Update the installer's [Tectonic Console deployment](https://github.com/coreos-inc/tectonic/blob/master/installer/assets/console-deployment.yaml.tmpl) version.

```
image: quay.io/coreos/tectonic-console:$VERSION
```

