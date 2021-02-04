import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import { K8sResourceKind } from '../../module/k8s';
import { SectionHeading } from './headings';

export const BuildHooks: React.SFC<BuildHooksProps> = ({ resource }) => {
  const postCommitArgs = _.get(resource, 'spec.postCommit.args');
  const postCommitCommand = _.get(resource, 'spec.postCommit.command');
  const postCommitScript = _.get(resource, 'spec.postCommit.script');
  const { t } = useTranslation();

  return !_.isEmpty(postCommitCommand) || !_.isEmpty(postCommitArgs) || postCommitScript ? (
    <div className="co-m-pane__body">
      <SectionHeading text={t('public~Post-commit hooks')} />
      <dl className="co-m-pane__details">
        {!_.isEmpty(postCommitCommand) && <dt>{t('public~Command')}</dt>}
        {!_.isEmpty(postCommitCommand) && (
          <dd>
            <code>{postCommitCommand.join(' ')}</code>
          </dd>
        )}
        {postCommitScript && <dt>{t('public~Script')}</dt>}
        {postCommitScript && (
          <dd>
            <code>{postCommitScript}</code>
          </dd>
        )}
        {!_.isEmpty(postCommitArgs) && <dt>{t('public~Args')}</dt>}
        {!_.isEmpty(postCommitArgs) && (
          <dd>
            <code>{postCommitArgs.join(' ')}</code>
          </dd>
        )}
      </dl>
    </div>
  ) : null;
};

export type BuildHooksProps = {
  resource: K8sResourceKind;
};

BuildHooks.displayName = 'BuildHooks';
