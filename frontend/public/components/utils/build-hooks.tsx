import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { K8sResourceKind } from '../../module/k8s';
import { SectionHeading } from './headings';

export const BuildHooks: React.SFC<BuildHooksProps> = ({ resource }) => {
  const postCommitArgs = _.get(resource, 'spec.postCommit.args');
  const postCommitCommand = _.get(resource, 'spec.postCommit.command');
  const postCommitScript = _.get(resource, 'spec.postCommit.script');
  const { t } = useTranslation();

  return !_.isEmpty(postCommitCommand) || !_.isEmpty(postCommitArgs) || postCommitScript ? (
    <PaneBody>
      <SectionHeading text={t('public~Post-commit hooks')} />
      <dl className="co-m-pane__details">
        {!_.isEmpty(postCommitCommand) && <dt>{t('public~Command')}</dt>}
        {!_.isEmpty(postCommitCommand) && (
          <dd>
            <code className="co-code">{postCommitCommand.join(' ')}</code>
          </dd>
        )}
        {postCommitScript && <dt>{t('public~Script')}</dt>}
        {postCommitScript && (
          <dd>
            <code className="co-code">{postCommitScript}</code>
          </dd>
        )}
        {!_.isEmpty(postCommitArgs) && <dt>{t('public~Args')}</dt>}
        {!_.isEmpty(postCommitArgs) && (
          <dd>
            <code className="co-code">{postCommitArgs.join(' ')}</code>
          </dd>
        )}
      </dl>
    </PaneBody>
  ) : null;
};

export type BuildHooksProps = {
  resource: K8sResourceKind;
};

BuildHooks.displayName = 'BuildHooks';
