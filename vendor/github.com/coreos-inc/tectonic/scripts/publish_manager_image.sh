#!/bin/bash -e

# This script attempts to push, and tag a new manager image based on an existing
# manager image.
#
# It will attempt to detect if the current commit has an associated git tag, if
# it does, it continues.
#
# It then expects an existing Docker image to be be pushed and tagged
# with the same git commit SHA1 the git tag is pointing to.
#
# If all of the above holds true, it will tag a new Docker image using the git
# tag specified, and then it will push the newly tagged image. Otherwise it
# will fail and exit unsuccessfully.

# pull the current git commit hash
COMMIT=`git rev-parse HEAD`

# check if the current commit has a matching tag
TAG=$(git describe --exact-match --abbrev=0 --tags ${COMMIT} 2> /dev/null || true)

IMAGE_NAME="quay.io/coreos/tectonic-manager"

# use the matching tag as the version, if available
if [ -z "$TAG" ]; then
    # PR or merge to master
    echo "Unable to detect a git tag, cannot publish non-tag"
    exit 1
else
    EXISTING_IMAGE="$IMAGE_NAME:$COMMIT"
    NEW_IMAGE="$IMAGE_NAME:$TAG"
    echo "Detected a git tag:   $TAG"
    echo "Existing Image:       $EXISTING_IMAGE"
    echo "New Image:            $NEW_IMAGE"
    echo
    echo "Tagging and Pushing the new image..."
    echo
    # git tag pushed to master, so we only want to tag an existing manager image
    # specified by $COMMIT to $TAG
    set -x
    docker pull $EXISTING_IMAGE
    docker tag $EXISTING_IMAGE $NEW_IMAGE
    docker push $NEW_IMAGE
    set +x

    exit 0
fi

