#!/bin/bash
set -x

UNIQUE=`date +%D_%T|sed 's/\//_/g'|sed 's/:/-/g'`
ROOT=~/tmp/console-mergeUpstream-${UNIQUE}
MERGE_BRANCH=mergeUpstream_${UNIQUE}

UPSTREAM_GIT=https://github.com/openshift/console.git # the source of patches to be merged
UPSTREAM_BRANCH=master

PRIVATE_GIT_USER=mareklibra # acts as a mediator to not create dummy branches under OKDVIRT_REPO
PRIVATE_REPO=https://github.com/${PRIVATE_GIT_USER}/kubevirt-web-ui # note: create your own fork of UPSTREAM_GIT here
PRIVATE_GIT=${PRIVATE_REPO}.git

OKDVIRT_REPO=https://github.com/kubevirt/web-ui # The repo where new PR is about to be created
OKDVIRT_GIT=${OKDVIRT_REPO}.git
OKDVIRT_BRANCH=master # the PR target branch

rm -rf ${ROOT}
git clone ${PRIVATE_GIT} ${ROOT}
cd ${ROOT}
git remote add upstream ${UPSTREAM_GIT}
git remote add okdvirt ${OKDVIRT_GIT}
git fetch --all

git checkout okdvirt/${OKDVIRT_BRANCH}
git checkout -b ${MERGE_BRANCH}
git merge upstream/${UPSTREAM_BRANCH}

cat <<EOF
Now resolve all merge conflicts in following directory:

  cd ${ROOT} && get status

Then open pull-request by

  git push --set-upstream origin ${MERGE_BRANCH}
  firefox ${OKDVIRT_REPO}/compare/${OKDVIRT_BRANCH}...${PRIVATE_GIT_USER}:${MERGE_BRANCH}?expand=1 &

To see kubevirt/web-ui diference to upstream

  git log remotes/upstream/master..${MERGE_BRANCH}
EOF

