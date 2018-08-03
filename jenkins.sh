#!/usr/bin/env bash

set -eo pipefail

# This script contains all jenkins work.
# This runs directly on the jenkins build host.
# The Jenkins build command should do nothing but execute this script.

CURRENT_USER=$(whoami)
CURRENT_UID=$(id -u "$CURRENT_USER")
echo "Running under user: $CURRENT_USER, with uid: $CURRENT_UID"

# We assume the jenkins jenkins user with uid 1000 on all build hosts
export BUILDER_RUN_USER=1000

if [ ${BUILDER_RUN_USER} -eq "${CURRENT_UID}" ]; then
    echo "Running under User: ${CURRENT_USER}, with UID: ${CURRENT_UID}"
else
    echo "Expected to run with UID: ${BUILDER_RUN_USER}, instead UID is: ${CURRENT_UID}. Fix Jenkins and try again."
    exit 1
fi

S3_BUCKET="teamui-jenkins"
S3_URL="https://s3.amazonaws.com/$S3_BUCKET/"

status() {
    # Hide output so we don't leak creds in Jenkins log
    set +x
    description=${3:-"$1 $2."}
    data=$(cat << EOF
{
  "context": "$1",
  "state": "$2",
  "description": "${description}",
  "target_url": "${S3_URL}${BUILD_TAG}/${1}.log"
}
EOF
)
    # TODO: use correct target url for performance status
    # "target_url": "${BUILD_URL}console"
    # shellcheck disable=SC2154
    curl -o /dev/null --silent -X POST --user "${GITHUB_CREDENTIALS}" \
    --data "$data" \
    "https://api.github.com/repos/openshift/console/statuses/${ghprbActualCommit}"
    set -x
}

s3_upload () {
    # Hide output so we don't leak creds in Jenkins log
    set +x
    file=$1
    dest=$2
    content_type='text/plain'
    datetime=$(TZ=utc date +"%a, %d %b %Y %T %z")
    acl="x-amz-acl:public-read"
    body="PUT\n\n${content_type}\n${datetime}\n${acl}\n/${S3_BUCKET}/${dest}"
    signature=$(echo -en "${body}" | openssl sha1 -hmac "${AWS_SECRET_ACCESS_KEY}" -binary | base64)

    curl -o /dev/null --silent -X PUT -T "${file}" \
      -H "Host: ${S3_BUCKET}.s3.amazonaws.com" \
      -H "Date: ${datetime}" \
      -H "Content-Type: ${content_type}" \
      -H "${acl}" \
      -H "Authorization: AWS ${AWS_ACCESS_KEY_ID}:${signature}" \
      "https://${S3_BUCKET}.s3.amazonaws.com/${dest}"
    set -x
}


builder_run () {
    name=$1
    shift
    needs_kubeconfig=$1
    shift
    exit_on_err=$1
    shift
    cmd=$*

    status "$name" 'pending'

    if [ "$needs_kubeconfig" -ne 0 ]
    then
        export DOCKER_ENV="KUBECONFIG"
    fi

    mkdir -p jenkins-logs
    # shellcheck disable=SC2086
    if ./builder-run.sh $cmd 2>&1 | tee "jenkins-logs/$name.log"
    then
        status "$name" 'success'
        s3_upload "jenkins-logs/$name.log" "$BUILD_TAG/$name.log"
    else
        status "$name" 'error'
        s3_upload "jenkins-logs/$name.log" "$BUILD_TAG/$name.log"
        if [ "$exit_on_err" -ne 0 ]
        then
            exit 1
        fi
    fi
    unset DOCKER_ENV
}

set -x
./clean.sh

set +e

builder_run 'Build' 0 1 ./build.sh
builder_run 'Tests' 0 1 ./test.sh
builder_run 'GUI-Tests' 1 1 ./test-gui.sh crud
builder_run 'GUI-Tests-OLM' 1 0 ./test-gui.sh olm

status 'Performance' 'pending'
if DOCKER_ENV="KUBECONFIG" ./builder-run.sh ./test-gui.sh performance
then
    description=$(cat ./frontend/gui_test_screenshots/bundle-analysis.txt)
    status 'Performance' 'success' "${description}"
else
    description=$(cat ./frontend/gui_test_screenshots/bundle-analysis.txt)
    status 'Performance' 'error' "${description}"
    exit 1
fi

set -e

GIT_SHA_HEAD=$(git rev-parse HEAD)
GIT_SHA_MASTER=$(git rev-parse origin/master)
IS_RELEASE_TAG=$(git describe --exact-match --abbrev=0 --tags "${GIT_SHA_HEAD}" 2> /dev/null || :)
if [ "$GIT_SHA_HEAD" == "$GIT_SHA_MASTER" ]; then
    echo "detected master build. building & pushing images..."
    ./push.sh
elif [ ! -z "$IMAGE_TAG" ]; then
    echo "detected request to push built image using tag ${IMAGE_TAG}. building & pushing images..."
   ./push.sh
elif [ -n "$IS_RELEASE_TAG" ]; then
    echo "detected release tag ${IS_RELEASE_TAG}. building & pushing images..."
    ./push.sh
else
    echo "skipping image push. HEAD sha does not appear to be master, nor is it a release tag: $GIT_SHA_HEAD"
fi

echo "Cleaning up old Docker images..."

set +e
# delete stopped containers
docker ps -a -q | xargs docker rm
# docker rm $(docker ps -a -q)

# delete images except for console builder (fails on images currently used)
docker images | grep -F -v quay.io/coreos/tectonic-console-builder | awk '{print $3}' | grep -v IMAGE | xargs docker rmi

# delete orphaned volumes
docker volume ls -qf dangling=true | xargs -r docker volume rm
set -e

echo "Done!"
