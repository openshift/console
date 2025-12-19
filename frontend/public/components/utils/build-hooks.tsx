import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { K8sResourceKind } from '../../module/k8s';
import { SectionHeading } from './headings';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

export const BuildHooks: React.FCC<BuildHooksProps> = ({ resource }) => {
  const postCommitArgs = _.get(resource, 'spec.postCommit.args');
  const postCommitCommand = _.get(resource, 'spec.postCommit.command');
  const postCommitScript = _.get(resource, 'spec.postCommit.script');
  const { t } = useTranslation();

  return !_.isEmpty(postCommitCommand) || !_.isEmpty(postCommitArgs) || postCommitScript ? (
    <PaneBody>
      <SectionHeading text={t('public~Post-commit hooks')} />
      <DescriptionList>
        {!_.isEmpty(postCommitCommand) && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Command')}</DescriptionListTerm>
            <DescriptionListDescription>
              <code className="co-code">{postCommitCommand.join(' ')}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {postCommitScript && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Script')}</DescriptionListTerm>
            <DescriptionListDescription>
              <code className="co-code">{postCommitScript}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {!_.isEmpty(postCommitArgs) && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Args')}</DescriptionListTerm>
            <DescriptionListDescription>
              <code className="co-code">{postCommitArgs.join(' ')}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </PaneBody>
  ) : null;
};

export type BuildHooksProps = {
  resource: K8sResourceKind;
};

BuildHooks.displayName = 'BuildHooks';
