#!/bin/bash
set -x

UNIQUE=`date +%D_%T|sed 's/\//_/g'|sed 's/:/-/g'`
ROOT=~/tmp/console-mergeUpstream-${UNIQUE}
MERGE_BRANCH=mergeUpstream_${UNIQUE}

UPSTREAM_GIT=https://github.com/openshift/console.git # the source of patches to be merged
UPSTREAM_BRANCH=master

OKDVIRT_REPO=https://github.com/kubevirt/web-ui # The repo where new PR is about to be created
OKDVIRT_GIT=${OKDVIRT_REPO}.git
OKDVIRT_BRANCH=master # the PR target branch

rm -rf ${ROOT}
git clone ${OKDVIRT_GIT} ${ROOT}
cd ${ROOT}
git remote add upstream ${UPSTREAM_GIT}
git fetch --all

git checkout -b okdvirt.master -t remotes/origin/${OKDVIRT_BRANCH}
export COMMIT_COUNT_BEFORE=`git log --pretty=oneline | wc -l`
git merge upstream/${UPSTREAM_BRANCH} -v
echo Commit count before merge: ${COMMIT_COUNT_BEFORE}
echo Commit count after merge: `git log --pretty=oneline | wc -l`

cat <<EOF
Now resolve all merge conflicts in following directory:

  cd ${ROOT} && git status

Then push changes to kubevirt-web-ui HEAD:master by

  cd ${ROOT} && ./build.sh && cd frontend && yarn run lint && yarn run test && \\
  git status && git push origin HEAD:master

To see kubevirt/web-ui diference to upstream

  git log remotes/upstream/master..${OKDVIRT_BRANCH}
EOF

