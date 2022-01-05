import * as React from 'react';
import { Split, SplitItem, Tooltip } from '@patternfly/react-core';
import { HeartBrokenIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import {
  global_danger_color_100 as RedColor,
  global_warning_color_100 as YellowColor,
} from '@patternfly/react-tokens';
import { useTranslation } from 'react-i18next';
import { GitOpsEnvironmentService, GitOpsHealthResources } from '../utils/gitops-types';
import './GitOpsResourcesSection.scss';

interface GitOpsResourceRowProps {
  resources: GitOpsHealthResources[] | GitOpsEnvironmentService[];
  degradedResources: string[] | null;
  nonSyncedResources: string[];
}

const GitOpsResourceRow: React.FC<GitOpsResourceRowProps> = ({
  resources,
  degradedResources,
  nonSyncedResources,
}) => {
  const { t } = useTranslation();
  return (
    <Split hasGutter>
      {degradedResources?.length > 0 && (
        <Tooltip
          content={t('gitops-plugin~{{x}} of {{total}} Unhealthy', {
            x: degradedResources.length.toString(),
            total: resources?.length.toString() ?? '0',
          })}
        >
          <SplitItem>
            <>
              {degradedResources.length}{' '}
              <HeartBrokenIcon color={RedColor.value} className="co-icon-space-r" />
            </>
          </SplitItem>
        </Tooltip>
      )}
      {nonSyncedResources.length > 0 && (
        <Tooltip
          content={t('gitops-plugin~{{x}} of {{total}} OutOfSync', {
            x: nonSyncedResources.length.toString(),
            total: resources?.length.toString() ?? '0',
          })}
        >
          <SplitItem>
            <>
              {nonSyncedResources.length}{' '}
              <ExclamationTriangleIcon color={YellowColor.value} className="co-icon-space-r" />
            </>
          </SplitItem>
        </Tooltip>
      )}
      {(degradedResources === null || degradedResources.length === 0) &&
        nonSyncedResources.length === 0 && <>&nbsp;</>}
    </Split>
  );
};

export default GitOpsResourceRow;
