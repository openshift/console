import * as React from 'react';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel, PipelineRunModel } from '../../../models';
import { ComputedStatus, PipelineWithLatest, TaskRunKind } from '../../../types';
import { TaskStatus } from '../../../utils/pipeline-augment';
import {
  pipelineFilterReducer,
  pipelineRunStatus,
  pipelineTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import { getPipelineRunStatus } from '../../../utils/pipeline-utils';
import { useTaskRuns } from '../../pipelineruns/hooks/useTaskRuns';
import LinkedPipelineRunTaskStatus from '../../pipelineruns/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatusContent from '../../pipelineruns/status/PipelineRunStatusContent';
import { tableColumnClasses } from './pipeline-table';
import PipelineRowKebabActions from './PipelineRowKebabActions';

const pipelineReference = referenceForModel(PipelineModel);
const pipelinerunReference = referenceForModel(PipelineRunModel);

type PipelineStatusProps = {
  obj: PipelineWithLatest;
};

type PipelineRowWithoutTaskRunsProps = {
  obj: PipelineWithLatest;
  taskRunStatusObj: TaskStatus;
};

type PipelineRowWithTaskRunsProps = {
  obj: PipelineWithLatest;
};

const TASKRUNSFORPLRCACHE: { [key: string]: TaskRunKind[] } = {};
const InFlightStoreForTaskRunsForPLR: { [key: string]: boolean } = {};

const PipelineStatus: React.FC<PipelineStatusProps> = ({ obj }) => {
  return (
    <PipelineRunStatusContent
      status={pipelineFilterReducer(obj)}
      title={pipelineTitleFilterReducer(obj)}
      pipelineRun={obj.latestRun}
    />
  );
};

const PipelineRowTable = ({ obj, PLRTaskRuns, taskRunsLoaded, taskRunStatusObj }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {obj.latestRun && obj.latestRun.metadata && obj.latestRun.metadata.name ? (
          <ResourceLink
            kind={pipelinerunReference}
            name={obj.latestRun.metadata.name}
            namespace={obj.latestRun.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {obj.latestRun ? (
          <LinkedPipelineRunTaskStatus
            pipelineRun={obj.latestRun}
            taskRuns={PLRTaskRuns}
            taskRunsLoaded={taskRunsLoaded}
            taskRunStatusObj={taskRunStatusObj}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <PipelineStatus obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {(obj.latestRun?.status?.startTime && (
          <Timestamp timestamp={obj.latestRun.status.startTime} />
        )) ||
          '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <PipelineRowKebabActions pipeline={obj} />
      </TableData>
    </>
  );
};

const PipelineRowWithoutTaskRuns: React.FC<PipelineRowWithoutTaskRunsProps> = React.memo(
  ({ obj, taskRunStatusObj }) => {
    return (
      <PipelineRowTable
        obj={obj}
        PLRTaskRuns={[]}
        taskRunsLoaded
        taskRunStatusObj={taskRunStatusObj}
      />
    );
  },
);

const PipelineRowWithTaskRunsFetch: React.FC<PipelineRowWithTaskRunsProps> = React.memo(
  ({ obj }) => {
    const cacheKey = `${obj.latestRun.metadata.namespace}-${obj.latestRun.metadata.name}`;
    const [PLRTaskRuns, taskRunsLoaded] = useTaskRuns(
      obj.latestRun.metadata.namespace,
      obj.latestRun.metadata.name,
      undefined,
      `${obj.latestRun.metadata.namespace}-${obj.latestRun.metadata.name}`,
    );
    InFlightStoreForTaskRunsForPLR[cacheKey] = false;
    if (taskRunsLoaded) {
      TASKRUNSFORPLRCACHE[cacheKey] = PLRTaskRuns;
    }
    return (
      <PipelineRowTable
        obj={obj}
        PLRTaskRuns={PLRTaskRuns}
        taskRunsLoaded={taskRunsLoaded}
        taskRunStatusObj={undefined}
      />
    );
  },
);

const PipelineRowWithTaskRuns: React.FC<PipelineRowWithTaskRunsProps> = React.memo(({ obj }) => {
  let PLRTaskRuns: TaskRunKind[];
  let taskRunsLoaded: boolean;
  const cacheKey = `${obj.latestRun.metadata.namespace}-${obj.latestRun.metadata.name}`;
  const result = TASKRUNSFORPLRCACHE[cacheKey];
  if (result) {
    PLRTaskRuns = result;
    taskRunsLoaded = true;
  } else if (InFlightStoreForTaskRunsForPLR[cacheKey]) {
    PLRTaskRuns = [];
    taskRunsLoaded = true;
    InFlightStoreForTaskRunsForPLR[cacheKey] = true;
  } else {
    return <PipelineRowWithTaskRunsFetch obj={obj} />;
  }
  return (
    <PipelineRowTable
      obj={obj}
      PLRTaskRuns={PLRTaskRuns}
      taskRunsLoaded={taskRunsLoaded}
      taskRunStatusObj={undefined}
    />
  );
});

const PipelineRow: React.FC<RowFunctionArgs<PipelineWithLatest>> = ({ obj }) => {
  const plrStatus = pipelineRunStatus(obj.latestRun);
  if (
    plrStatus === ComputedStatus.Cancelled &&
    (obj?.latestRun?.status?.childReferences ?? []).length > 0
  ) {
    return <PipelineRowWithTaskRuns obj={obj} />;
  }

  const taskRunStatusObj = getPipelineRunStatus(obj.latestRun);
  return <PipelineRowWithoutTaskRuns obj={obj} taskRunStatusObj={taskRunStatusObj} />;
};

export default PipelineRow;
