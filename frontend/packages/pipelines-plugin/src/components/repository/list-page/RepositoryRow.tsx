import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  Kebab,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  resourcePath,
  Timestamp,
} from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { getLatestRun } from '@console/pipelines-plugin/src/utils/pipeline-augment';
import { PipelineRunModel, RepositoryModel } from '../../../models';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../../utils/pipeline-utils';
import LinkedPipelineRunTaskStatus from '../../pipelineruns/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../../pipelineruns/status/PipelineRunStatus';
import { getTaskRunsOfPipelineRun } from '../../taskruns/useTaskRuns';
import { RepositoryFields, RepositoryLabels } from '../consts';
import { RepositoryKind } from '../types';
import { repositoriesTableColumnClasses } from './RepositoryHeader';

const RepositoryRow: React.FC<RowFunctionArgs<RepositoryKind>> = ({ obj, customData }) => {
  const {
    metadata: { name, namespace },
  } = obj;
  const { taskRuns, pipelineRuns, taskRunsLoaded } = customData;
  const plrs = pipelineRuns.filter((plr) => {
    return (
      plr.metadata?.labels?.[RepositoryLabels[RepositoryFields.REPOSITORY]] === obj.metadata.name
    );
  });
  const latestRun = getLatestRun(plrs, 'creationTimestamp');

  const latestPLREventType =
    latestRun && latestRun?.metadata?.labels[RepositoryLabels[RepositoryFields.EVENT_TYPE]];

  const PLRTaskRuns = getTaskRunsOfPipelineRun(taskRuns, latestRun?.metadata?.name);
  return (
    <>
      <TableData className={repositoriesTableColumnClasses[0]}>
        <ResourceIcon kind={referenceForModel(RepositoryModel)} />
        <Link
          to={`${resourcePath(referenceForModel(RepositoryModel), name, namespace)}/Runs`}
          className="co-resource-item__resource-name"
          data-test-id={name}
        >
          {name}
        </Link>
      </TableData>
      <TableData className={repositoriesTableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={repositoriesTableColumnClasses[2]}>
        {latestPLREventType || '-'}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[3]}>
        {latestRun ? (
          <ResourceLink
            kind={referenceForModel(PipelineRunModel)}
            name={latestRun?.metadata.name}
            namespace={namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[4]}>
        {}
        {latestRun ? (
          <LinkedPipelineRunTaskStatus
            pipelineRun={latestRun}
            taskRuns={PLRTaskRuns}
            taskRunsLoaded={taskRunsLoaded}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[5]}>
        {
          <PipelineRunStatus
            status={pipelineRunFilterReducer(latestRun)}
            title={pipelineRunTitleFilterReducer(latestRun)}
            pipelineRun={latestRun}
            taskRuns={PLRTaskRuns}
            taskRunsLoaded={taskRunsLoaded}
          />
        }
      </TableData>
      <TableData className={repositoriesTableColumnClasses[6]}>
        {<Timestamp timestamp={latestRun?.status.startTime} />}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[7]}>
        {pipelineRunDuration(latestRun)}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[8]}>
        <ResourceKebab actions={Kebab.factory.common} kind={referenceFor(obj)} resource={obj} />
      </TableData>
    </>
  );
};

export default RepositoryRow;
