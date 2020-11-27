import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import GitOpsListItem from './GitOpsListItem';
import { Stack, StackItem, Split, SplitItem } from '@patternfly/react-core';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import GitOpsEmptyState from '../GitOpsEmptyState';
import './GitOpsList.scss';

interface GitOpsListProps {
  appGroups: GitOpsAppGroupData[];
  emptyStateMsg: string;
}

const GitOpsList: React.FC<GitOpsListProps> = ({ appGroups, emptyStateMsg }) => {
  const { t } = useTranslation();
  return (
    <div className="odc-gitops-list">
      {!emptyStateMsg ? (
        <Stack hasGutter>
          <StackItem>
            <Split>
              <SplitItem isFilled />
              <SplitItem>
                {t('devconsole~{{count, number}} item', {
                  count: _.size(appGroups),
                })}
              </SplitItem>
            </Split>
          </StackItem>
          {_.map(appGroups, (appGroup) => (
            <StackItem key={`${appGroup.name}-${appGroup.repo_url}`}>
              <GitOpsListItem appGroup={appGroup} />
            </StackItem>
          ))}
        </Stack>
      ) : (
        <GitOpsEmptyState emptyStateMsg={emptyStateMsg} />
      )}
    </div>
  );
};

export default GitOpsList;
