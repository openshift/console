import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  ResourceLink,
  Timestamp,
  truncateMiddle,
  ExternalLink,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind, TaskRunKind } from '../../types';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../utils/pipeline-utils';
import LinkedPipelineRunTaskStatus from '../pipelineruns/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../pipelineruns/status/PipelineRunStatus';
import { ResourceKebabWithUserLabel } from '../pipelineruns/triggered-by';
import { getTaskRunsOfPipelineRun } from '../taskruns/useTaskRuns';
import {
  RepositoryLabels,
  RepositoryFields,
  RepoAnnotationFields,
  RepositoryAnnotations,
} from './consts';
import { sanitizeBranchName } from './repository-utils';
import { tableColumnClasses } from './RepositoryPipelineRunHeader';

const pipelinerunReference = referenceForModel(PipelineRunModel);

type PLRStatusProps = {
  obj: PipelineRunKind;
  taskRuns: TaskRunKind[];
};

const PLRStatus: React.FC<PLRStatusProps> = ({ obj, taskRuns }) => {
  return (
    <PipelineRunStatus
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
      taskRuns={taskRuns}
    />
  );
};

const RepositoryPipelineRunRow: React.FC<RowFunctionArgs<PipelineRunKind>> = ({
  obj,
  customData,
}) => {
  const plrLabels = obj.metadata.labels;
  const plrAnnotations = obj.metadata.annotations;
  const { operatorVersion, taskRuns } = customData;
  const PLRTaskRuns = getTaskRunsOfPipelineRun(taskRuns, obj?.metadata?.name);
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelinerunReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          data-test-id={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="sha">
        <Tooltip
          data-test="tooltip-msg"
          content={
            <>
              {plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_MESSAGE]] ??
                plrLabels?.[RepositoryLabels[RepositoryFields.SHA]]}
            </>
          }
        >
          <ExternalLink
            href={plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_URL]]}
          >
            {truncateMiddle(plrLabels[RepositoryLabels[RepositoryFields.SHA]], {
              length: 7,
              truncateEnd: true,
              omission: '',
            })}
          </ExternalLink>
        </Tooltip>
      </TableData>
      <TableData className={tableColumnClasses[2]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <PLRStatus obj={obj} taskRuns={PLRTaskRuns} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <LinkedPipelineRunTaskStatus pipelineRun={obj} taskRuns={PLRTaskRuns} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>{pipelineRunDuration(obj)}</TableData>
      <TableData className={tableColumnClasses[7]}>
        {sanitizeBranchName(plrLabels?.[RepositoryLabels[RepositoryFields.BRANCH]])}
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebabWithUserLabel
          actions={getPipelineRunKebabActions(operatorVersion, PLRTaskRuns)}
          kind={pipelinerunReference}
          resource={obj}
        />
      </TableData>
    </>
  );
};

export default RepositoryPipelineRunRow;
