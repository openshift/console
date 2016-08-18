#!/bin/bash -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."

source "$ROOT/scripts/common.env.sh"
source "$ROOT/scripts/awsutil.sh"
contentType="application/octet-stream"

mkdir -p "$BOOTSTRAP_RELEASE_DIR"

# pull the current git commit hash
COMMIT=`git rev-parse HEAD`
# check if the current commit has a matching tag
TAG=$(git describe --exact-match --abbrev=0 --tags ${COMMIT} 2> /dev/null || true)

# if this isn't a tag, then we should not continue
if [ -z "$TAG" ]; then
    echo "Expected a matching git tag for current commit, but found none. Exiting."
    exit 1
else
    echo "Found tag $TAG, retrieving binaries from S3 using tag's commit $COMMIT"
fi

check_aws_creds

for os in "linux" "darwin" "windows"; do
    remote_file="build-artifacts/bootstrap/$COMMIT/bin/$os/bootstrap"
    dest_dir="$BOOTSTRAP_RELEASE_DIR/$os"
    dest="$dest_dir/bootstrap"
    mkdir -p "$dest_dir"
    aws_download_file "$remote_file" "$dest" "$contentType"
    chmod +x "$dest"
done

