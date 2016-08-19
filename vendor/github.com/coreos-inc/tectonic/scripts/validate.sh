#!/bin/bash -e
# This validates that the current checkout is in a releasable state. This means
# that component Docker base image versions are correct, and that there
# are not any untagged changes, or uncommitted files in the repository.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."
source "$ROOT/scripts/common.env.sh"

main() {
    echo "Verifying Docker base image versions are correct"
    $ROOT/scripts/check_component_versions.sh
    echo "Docker base images are correct"

    echo "Verifying Git working tree is clean"
    require_clean_work_tree "validate"
    echo "Git working tree is clean"
    echo
}

require_clean_work_tree () {
    # Update the index
    git update-index -q --ignore-submodules --refresh
    err=0

    # Disallow unstaged changes in the working tree
    if ! git diff-files --quiet --ignore-submodules --
    then
        echo >&2 "cannot $1: you have unstaged changes."
        git diff-files --name-status -r --ignore-submodules -- >&2
        err=1
    fi

    # Disallow uncommitted changes in the index
    if ! git diff-index --cached --quiet HEAD --ignore-submodules --
    then
        echo >&2 "cannot $1: your index contains uncommitted changes."
        git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2
        err=1
    fi

    if [ $err = 1 ]
    then
        echo >&2 "Please commit or stash them."
        exit 1
    fi
}

main $@
