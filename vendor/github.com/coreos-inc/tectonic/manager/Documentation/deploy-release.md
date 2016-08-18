# THIS DOCUMENT IS A VERY ROUGH DRAFT

Written Dec 30th, 2015, at release 0.5.3

This document is essentially notes transcribed during a release. It is
not currently authoritative and could use a lot of love.

## Steps to releasing

### Before Release

The primary artifact associated with a release is a build of the
[tectonic-manager](https://github.com/coreos-inc/tectonic-manager/)
project. That project contains configurations, including versioned
references, to other artifacts that will end up deployed and running
in a working, by-the-book Kubernetes installation.

Tectonic-manager deploys Kubernetes manifests from files located in the
`manifests` directory of this repository. Many of these manifests
have hard-coded version numbers, and image tags. Cutting a new release
of the tectonic system means updating all of these references with the new
references you'd like to deploy to users. For example, to update the version
of tectonic-console in your deployment, you'll want to find what the current
version is:

```
$ git grep tectonic-console\: manifests
manifests/manager-manifests/tectonic-console-deployment.yaml:19:        image: quay.io/coreos/tectonic-console:v0.1.9
```

This should show you the current image and tag being used for console. When
releasing you'll want to update this tag to whichever version you would like to
use. More details on updating versions also included in the README at the root
of the repository.

The quay tags you'll want to use are created by CI systems when new
commits appear in the projects' master branches. Be sure to verify
that the images you intend to deploy are present in quay, and update
the hard coded references in the go files in pkg/app to refer to the
new tags. The quay tags are also commit hashes from their associated
projects, so you can check the diff between the currently deployed
version and your new proposed version. Run the diff and sanity check
the changes.

Once you've updated the tags, You'll need to build and test tectonic-manager by
following the instructions in
[tectonic-manager/README.md](https://github.com/coreos-inc/tectonic-manager/blob/master/README.md)
Briefly, that means setting connecting to docker in the VM or cluster
you're intending to use for testing, running `make clean all`, setting
up a license, and running `dev/spin up`, but the README is the
authoritative, detailed, and up to date source for instructions on
building and testing the tectonic-manager project. Your new release
should be built and tested locally before you commit to building and
tagging it for public use. Once you're confident in your changes,
commit, and submit them to review and merge into tectonic-manager
master.

## Releasing

### Tag the release

At this point, tectonic-manager:HEAD contains the code you'd like to
release to customers. Now it's up to you to tag it, build it, and then
document it so that customers can pick it up.

Tag the desired commit in tectonic-manager with a signed tag. Copy the
format of existing tags.

```
git tag -s vX.Y.Z
git push origin vX.Y.Z
```

### Build the tagged release

Once tectonic-manager is tagged, build a release artifact in Jenkins

https://jenkins.coreos.systems/job/tectonic-manager/

Choose "Build with Parameters", where the only parameter to change is
GIT_REF. Use your new tag as the GIT_REF to build.

If the Jenkins build succeeds, you will have created a new
tectonic-manager image in quay, at

https://quay.io/repository/tectonic/manager?tab=tags

Verify that your build succeeded, and appeared in the right place.

### Document and test the tagged release

At this point, your release artifact is publicly available, but is
untested and (practically) invisible to customers.

Customers follow the documentation in the
[tectonic](https://github.com/coreos-inc/tectonic) project to deploy
Tectonic to their Kubernetes clusters. To test your new release, you
should follow the same steps that they will.

To get started, grep the tectonic repository for the version tag
you'll be replacing, and replace it with your new tag. Now you'll have
the same collection of documents that users will have, and you'll want
to follow them to get Tectonic set up and working. If it doesn't work
for you, it won't work for them. (At this writing,
tectonic/Documentation/deployer/files/tectonic-services.yml is the
only place needing a change, but this is the sort of knowledge that
rots very quickly).

Once you're confident that your changes work, you can commit and
submit a pull request with your new version.

### Document and Tag the release documentation

Now all that is left is to tag your changes in the `tectonic`
repository.  Our convention is to use a tag format identical to the one you
used for tectonic-manager (however the actual tag value is the customer facing vanity version).
Copy the comment format of the existing tags in the repositories.

You should also write up a change log in the Github release associated
with the tag you've created in the tectonic repository. Edit the
[tectonic Github
release](https://github.com/coreos-inc/tectonic/releases) associated
with your new tag. Follow the format of previous releases.

Once your documentation changes are tagged and released, you're done!

### Make PR for website docs changes

TODO: Need docs here b/c tectonic-pages scripts are wonky and undocumented.

Let the UX team know you've made the release, and they'll use your documentation tag to update the web site.
