import * as React from 'react';
import * as classNames from 'classnames';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { Timestamp } from '@console/internal/components/utils';
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
        <Timestamp timestamp={data.deployed_at} key={data.deployed_at} />
      </TableData>
      <TableData
        className={classNames(GitOpsDeploymentHistoryTableColumnClasses[1], 'co-break-word')}
        columnID="description"
      >
        {data.message}
      </TableData>
      <TableData
        className={classNames(GitOpsDeploymentHistoryTableColumnClasses[2], 'co-break-word')}
      >
        {data.environment}
      </TableData>
      <TableData className={GitOpsDeploymentHistoryTableColumnClasses[3]}>{data.author}</TableData>
      <TableData
        className={classNames(GitOpsDeploymentHistoryTableColumnClasses[4], 'pf-u-text-nowrap')}
      >
        <CommitRevision repoUrl={data.repo_url} revision={data.revision} />
      </TableData>
    </>
  );
};
