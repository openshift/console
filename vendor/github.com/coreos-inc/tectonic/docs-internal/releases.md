# Releases

This repository contains a set of scripts, primarily located within the repository root in the `scripts` directory. These scripts are primarily used to automate the process of validating a release before tagging and creating a release tarball for a given release version.

# Release Steps

Open `versions-manifest.txt`. Verify the `versions.tectonic_release` is the version you're about to release. If it is not, open a PR to bump this to the next release version. For details on how to bump the version see [bump-versions-manifest](#bump-versions-manifest). Once the PR has merged, you must wait for the corresponding jenkins master job to successfully complete before continuing.

## Get S3 Credentials

We need S3 credentials before we start, so export the `$SECURE_REPO` to point to your local cloned directory of [github.com/coreos-inc/secure](https://github.com/coreos-inc/secure), and follow directions in the README to decrypt the `/prod` directory.

```
source $SECURE_REPO/prod/tectonic_release_s3_upload_creds.env.txt
```

## Make

The top level makefile has a `release` target will run everything needed to make a release in a single command.

```
make release
```

## Tag and push the release:

Create the tag:

```
./scripts/tag_release.sh
```

Output:

```
Validating
Verifying Docker base image versions are correct
Validating builder base image versions
Component builder validated successfully
Validating identity base image versions
Component identity validated successfully
Validating manager base image versions
Component manager validated successfully
Validating postgres base image versions
Component postgres validated successfully
Validating wiz base image versions
Component wiz validated successfully
Docker base images are correct
Verifying Git working tree is clean
Git working tree is clean


Validation succeeded, tagging release

Using v1.2.3-alpha.6 as tag

You need a passphrase to unlock the secret key for
user: "Chance Zibolski <chance.zibolski@coreos.com>"
2048-bit RSA key, ID 0xCA94ADA5D2F59D54, created 2015-03-24


Tagged! Current tags:
tectonic-alpha.1
v0.0.6_test
v1.2.3-alpha.2
v1.2.3-alpha.3
v1.2.3-alpha.4
v1.2.3-alpha.5
v1.2.3-alpha.6
```


Push the tag:

```
git push $TAG
```

## Make a release tarball:

```
./scripts/make_release_tarball.sh
```

Output:

```
Retrieving coreos-baremetal release
+ curl -L -o /Users/chance/go/src/github.com/coreos-inc/tectonic/scripts/../.workspace/tmpdir/coreos-baremetal.tar.gz https://github.com/coreos/coreos-baremetal/releases/download/v0.4.0/coreos-baremetal-v0.4.0-linux-amd64.tar.gz
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   618    0   618    0     0   1061      0 --:--:-- --:--:-- --:--:--  1063
100 6407k  100 6407k    0     0  2216k      0  0:00:02  0:00:02 --:--:-- 3408k
+ tar -xzf /Users/chance/go/src/github.com/coreos-inc/tectonic/scripts/../.workspace/tmpdir/coreos-baremetal.tar.gz --strip-components=1 -C /Users/chance/go/src/github.com/coreos-inc/tectonic/scripts/../.workspace/v1.2.3-alpha.6/tectonic/coreos-baremetal coreos-baremetal-v0.4.0-linux-amd64/LICENSE coreos-baremetal-v0.4.0-linux-amd64/bootcfg coreos-baremetal-v0.4.0-linux-amd64/scripts coreos-baremetal-v0.4.0-linux-amd64/contrib
Retrieving bootstrap binaries
Found tag v1.2.3-alpha.6, retrieving binaries from S3 using tag's commit fa9046008447fae2e6a4bea592e564f7e7f48412
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  9.7M  100  9.7M    0     0  10.7M      0 --:--:-- --:--:-- --:--:-- 10.7M
downloaded to build-artifacts/bootstrap/fa9046008447fae2e6a4bea592e564f7e7f48412/bin/linux/bootstrap to /Users/chance/go/src/github.com/coreos-inc/tectonic/scripts/../.workspace/v1.2.3-alpha.6/tectonic/tectonic-install/linux/bootstrap
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 9919k  100 9919k    0     0  11.5M      0 --:--:-- --:--:-- --:--:-- 11.5M
downloaded to build-artifacts/bootstrap/fa9046008447fae2e6a4bea592e564f7e7f48412/bin/darwin/bootstrap to /Users/chance/go/src/github.com/coreos-inc/tectonic/scripts/../.workspace/v1.2.3-alpha.6/tectonic/tectonic-install/darwin/bootstrap
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 9999k  100 9999k    0     0  11.7M      0 --:--:-- --:--:-- --:--:-- 11.7M
downloaded to build-artifacts/bootstrap/fa9046008447fae2e6a4bea592e564f7e7f48412/bin/windows/bootstrap to /Users/chance/go/src/github.com/coreos-inc/tectonic/scripts/../.workspace/v1.2.3-alpha.6/tectonic/tectonic-install/windows/bootstrap
a .
a ./coreos-baremetal
a ./tectonic-install
a ./tectonic-install/darwin
a ./tectonic-install/linux
a ./tectonic-install/windows
a ./tectonic-install/windows/bootstrap
a ./tectonic-install/linux/bootstrap
a ./tectonic-install/darwin/bootstrap
a ./coreos-baremetal/bootcfg
a ./coreos-baremetal/contrib
a ./coreos-baremetal/LICENSE
a ./coreos-baremetal/scripts
a ./coreos-baremetal/scripts/get-coreos
a ./coreos-baremetal/scripts/tls
a ./coreos-baremetal/scripts/tls/cert-gen
a ./coreos-baremetal/scripts/tls/openssl.conf
a ./coreos-baremetal/scripts/tls/README.md
a ./coreos-baremetal/contrib/systemd
a ./coreos-baremetal/contrib/systemd/bootcfg.service
Release tarball is available at /Users/chance/go/src/github.com/coreos-inc/tectonic/tectonic-v1.2.3-alpha.6.tar.gz
```

## Publish the release:

Go to [Jenkins][jenkins]

Input the git tag for the sha1 parameter, and check the `PUBLISH_RELEASE` check box. Then submit the job.

Once the Jenkins job finishes. Go to the [Tectonic github releases][releases] and create a new release from the tag you pushed. Then upload the tarball after writing the release notes.

### Update the Website

Finally rebuild the website so that any changes made to the Public documentation show up on the tectonic.com.

[jenkins]: https://jenkins.coreos.systems/view/tectonic/job/tectonic/build?delay=0sec
[releases]: https://github.com/coreos-inc/tectonic/releases

# Release Process Implementation Details

Below are some details on _how_ the release scripts and process works.

## versions manifest

At the repository root is a file named `versions-manifest.json`. This file contains the following sections used by build and release automation:

At the top level are the following sections:

* `validation` - Sections within this key are purely for validation before making a release.
    * `docker_base_images` - This section of the manifest file specifies a key value mapping between components within the repository, and what they should be using for a docker base image. This ensures that for components which we build on top of, such as Dex and Postgres, we are able to look in a single location to determine what version a component is built on top of. This is used for validation.
* `versions` - Sections within this key are used by build and release tools.
    * `external_docker_tags` - This section is for software we include into Tectonic, but don't modify or build on top of. Currently this only applies to Tectonic Console and Tectonic Stats Collector, which we control, so we just use an existing release with no modifications to the docker image on top. So this section only specifies docker tags for those components to use when generating Kubernetes manifests to be built into the Tectonic-Manager Docker image. This is used to templating Kubernetes manifests.
    * `coreos_baremetal` - This section is used by the `scripts/make_release_tarball.sh` script. The script uses the value here to specify the coreos-baremetal release downloaded to create a release tarball.
    * `tectonic_release` - This specifies the top level Tectonic release version, which is used by the `scripts/tag_release.sh` script when tagging the release.

## Automated Builds

Our automated CI will build all components using the top level `build` script in the repository, run tests, and at the end, if it's a merge to master it will run the `push` script, which then runs the `push` script for all components it built. The push script will push docker images to quay for all components except `bootstrap`. The `bootstrap` push script instead uploads the binaries built for both Darwin and Linux to S3 in a sub directory named using the git commit. This ensures whenever a merge is made to master, all components have some kind of artifact published for retrieval later. This is very important, as it ensures making a release doesn't involve building anything new, instead we simply refer, or point to existing artifacts.

## Tagging a Release

Making a release starts with tagging any commit which has already been published. This effectively means any merge commits, or commits that were pushed directly to master.

Before you tag the release, ensure all values in `versions-manifest.txt` are correct, in particular check that the `coreos_baremetal` section is referring to the coreos-baremetal release which we want to include in our release.

To ensure no mistakes are made as part of the release process, a release script exists at `scripts/tag_release.sh`. This script does simple validation of the docker base images, and ensures a clean git workspace, no unstaged changes, and no uncommitted files. Once validated, it will attempt to create a git tag using the value from `release_version` in `versions-manifest.json`. While tagging, you will be prompted to enter your GPG key pass phrase, as the release script attempts to sign the git tag.

## Making a Release Tarball

To create a release tarball, first checkout the git tag you created previously if you're not already checked out on it. The commit that this tag points to will be used to fetch `bootstrap`'s binaries from S3.

Next, run `./scripts/make_release_tarball.sh`. What this will do is download the coreos-baremetal release, and bootstrap binaries, and combine them into a single tarball which can then be uploaded to Github. Once the tarball has been created, you can inspect the contents using `tar -tf tectonic-$TECTONIC_RELEASE_VERSION.tar.gz` replacing `$TECTONIC_RELEASE_VERSION` with the correct version.

## Publishing a Release

Before you can publish you must push the new tag using `git push $TAG` so that it can be used in the next step.

Next go to [Jenkins][jenkins]. After logging in, you will see two parameters that can be specified in the Jenkins job. Replace `master` in the `sha1` parameter with `refs/tags/$TAG`, replacing `$TAG` with the tag you pushed in the previous step. Additionally, you will want to enable the `PUBLISH_RELEASE` checkbox, so that jenkins will see this as a release build which needs to tag a new manager docker image based on a previous one instead of building as normal.

Once the Jenkins job finishes. Go to the [Tectonic github releases][releases] and create a new release from the tag you pushed. Then upload the tarball after writing the release notes.

