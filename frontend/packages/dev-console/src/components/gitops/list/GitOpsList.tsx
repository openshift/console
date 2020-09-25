import * as React from 'react';
import * as _ from 'lodash';
import GitOpsListItem from './GitOpsListItem';
import { Stack, StackItem, Split, SplitItem } from '@patternfly/react-core';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import './GitOpsList.scss';
import GitOpsEmptyState from '../GitOpsEmptyState';

interface GitOpsListProps {
  appGroups: GitOpsAppGroupData[];
  emptyStateMsg: string;
}

const GitOpsList: React.FC<GitOpsListProps> = ({ appGroups, emptyStateMsg }) => (
  <div className="odc-gitops-list">
    {!emptyStateMsg ? (
      <Stack hasGutter>
        <StackItem>
          <Split>
            <SplitItem isFilled />
            <SplitItem>{`${_.size(appGroups)} items`}</SplitItem>
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

export default GitOpsList;
