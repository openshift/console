#!/bin/bash -e
# This scripts validates docker base images are correctly set to the values
# specified in versions-manifest.json. This validation is used as part of the
# release script to ensure all our base images are what we expect before
# tagging the release.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."
source "$ROOT/scripts/common.env.sh"

for component in $(jq -r '.validation.docker_base_images | keys[]' $VERSIONS_MANIFEST); do
    echo "Validating $component base image versions"

    # all other components simply need their docker file base version validated
    # pipe through xargs to get rid of trailing/leading spaces cause I cant get
    # a proper regex to work on both linux/bsd sed
    dockerfile_from=$(sed -n -E 's/^FROM[:space:]*(.*)$/\1/p' "$ROOT/$component/Dockerfile" | xargs)
    manifest_base_tag=$(${DIR}/get_docker_base.sh $component)
    if [ "$dockerfile_from" != "$manifest_base_tag" ]; then
        echo "Component ${component}'s Dockerfile FROM '${dockerfile_from}' is not equal to manifest's specified tag: '$manifest_base_tag'"
        exit 1
    else
        echo "Component ${component} validated successfully"
    fi
done
