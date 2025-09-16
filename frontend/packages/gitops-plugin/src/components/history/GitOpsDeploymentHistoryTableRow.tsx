import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { GitOpsHistoryData } from '../utils/gitops-types';
import { CommitRevision } from './CommitRevision';
import { GitOpsDeploymentHistoryTableColumnClasses } from './GitOpsDeploymentHistoryTableColumnClasses';

export const GitOpsDeploymentHistoryTableRow: React.FC<RowFunctionArgs<GitOpsHistoryData>> = (
  props,
) => {
  const { obj: data } = props;
  return (
    <>
      <TableData className={GitOpsDeploymentHistoryTableColumnClasses[0]}>
        <Timestamp timestamp={new Date(data.deployed_at).toISOString()} key={data.deployed_at} />
      </TableData>
      <TableData
        className={css(GitOpsDeploymentHistoryTableColumnClasses[1], 'co-break-word')}
        columnID="description"
      >
        {data.message}
      </TableData>
      <TableData className={css(GitOpsDeploymentHistoryTableColumnClasses[2], 'co-break-word')}>
        {data.environment}
      </TableData>
      <TableData className={GitOpsDeploymentHistoryTableColumnClasses[3]}>{data.author}</TableData>
      <TableData
        className={css(GitOpsDeploymentHistoryTableColumnClasses[4], 'pf-v6-u-text-nowrap')}
      >
        <CommitRevision repoUrl={data.repo_url} revision={data.revision} />
      </TableData>
    </>
  );
};
