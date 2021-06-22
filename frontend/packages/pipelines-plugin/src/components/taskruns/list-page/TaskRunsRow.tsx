import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskRunModel, PipelineModel } from '../../../models';
import { TaskRunKind } from '../../../types';
import { getTaskRunKebabActions } from '../../../utils/pipeline-actions';
import { getModelReferenceFromTaskKind } from '../../../utils/pipeline-augment';
import { taskRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { TektonResourceLabel } from '../../pipelines/const';
import TaskRunStatus from '../status/TaskRunStatus';
import { tableColumnClasses } from './taskruns-table';

const taskRunsReference = referenceForModel(TaskRunModel);
const pipelineReference = referenceForModel(PipelineModel);

const TaskRunsRow: RowFunction<TaskRunKind> = ({ obj, index, key, style, ...props }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <ResourceLink
        kind={taskRunsReference}
        name={obj.metadata.name}
        namespace={obj.metadata.namespace}
        data-test-id={obj.metadata.name}
      />
    </TableData>
    <TableData className={tableColumnClasses[1]} columnID="namespace">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
    </TableData>
    {props.customData?.showPipelineColumn && (
      <TableData className={tableColumnClasses[2]}>
        {obj.metadata.labels[TektonResourceLabel.pipeline] ? (
          <ResourceLink
            kind={pipelineReference}
            name={obj.metadata.labels[TektonResourceLabel.pipeline]}
            namespace={obj.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
    )}
    <TableData className={tableColumnClasses[3]}>
      {obj.spec.taskRef?.name ? (
        <ResourceLink
          kind={getModelReferenceFromTaskKind(obj.spec.taskRef?.kind)}
          displayName={obj.metadata.labels[TektonResourceLabel.pipelineTask]}
          name={obj.spec.taskRef.name}
          namespace={obj.metadata.namespace}
        />
      ) : (
        '-'
      )}
    </TableData>
    <TableData className={tableColumnClasses[4]}>
      {obj.status?.podName ? (
        <ResourceLink kind="Pod" name={obj.status.podName} namespace={obj.metadata.namespace} />
      ) : (
        '-'
      )}
    </TableData>
    <TableData className={tableColumnClasses[5]}>
      <TaskRunStatus status={taskRunFilterReducer(obj)} taskRun={obj} />
    </TableData>
    <TableData className={tableColumnClasses[6]}>
      <Timestamp timestamp={obj?.status?.startTime} />
    </TableData>
    <TableData className={tableColumnClasses[7]}>
      <ResourceKebab actions={getTaskRunKebabActions()} kind={taskRunsReference} resource={obj} />
    </TableData>
  </TableRow>
);

export default TaskRunsRow;
