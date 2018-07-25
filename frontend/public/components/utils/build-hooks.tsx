import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind } from '../../module/k8s';
import { SectionHeading } from '.';

export const BuildHooks: React.SFC<BuildHooksProps> = ({ resource }) => {
  const postCommitArgs = _.get(resource, 'spec.postCommit.args');
  const postCommitCommand = _.get(resource, 'spec.postCommit.command');
  const postCommitScript = _.get(resource, 'spec.postCommit.script');

  return (!_.isEmpty(postCommitCommand) || !_.isEmpty(postCommitArgs) || postCommitScript)
    ? <div className="co-m-pane__body">
      <SectionHeading text="Post-Commit Hooks" />
      <dl className="co-m-pane__details">
        {!_.isEmpty(postCommitCommand) && <dt>Command</dt>}
        {!_.isEmpty(postCommitCommand) && <dd><code>{postCommitCommand.join(' ')}</code></dd>}
        {postCommitScript && <dt>Script</dt>}
        {postCommitScript && <dd><code>{postCommitScript}</code></dd>}
        {!_.isEmpty(postCommitArgs) && <dt>Args</dt>}
        {!_.isEmpty(postCommitArgs) && <dd><code>{postCommitArgs.join(' ')}</code></dd>}
      </dl>
    </div>
    : null;
};

/* eslint-disable no-undef */
export type BuildHooksProps = {
  resource: K8sResourceKind;
};
/* eslint-enable no-undef */

BuildHooks.displayName = 'BuildHooks';
