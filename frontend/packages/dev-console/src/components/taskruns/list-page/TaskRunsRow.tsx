import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp, Kebab, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskRunKind } from '../../../utils/pipeline-augment';
import { TaskRunModel, PipelineModel, TaskModel } from '../../../models';
import { tableColumnClasses } from './taskruns-table';
import { Status } from '@console/shared';
import { pipelineRunFilterReducer as taskRunFilterReducer } from '../../../utils/pipeline-filter-reducer';

const taskRunsReference = referenceForModel(TaskRunModel);
const taskReference = referenceForModel(TaskModel);
const pipelineReference = referenceForModel(PipelineModel);

const TaskRunsRow: RowFunction<TaskRunKind> = ({ obj, index, key, style, ...props }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <ResourceLink
        kind={taskRunsReference}
        name={obj.metadata.name}
        namespace={obj.metadata.namespace}
        title={obj.metadata.name}
        data-test-id={obj.metadata.name}
      />
    </TableData>
    <TableData className={tableColumnClasses[1]} columnID="namespace">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
    </TableData>
    {props.customData?.showPipelineColumn && (
      <TableData className={tableColumnClasses[2]}>
        {obj.metadata.labels['tekton.dev/pipeline'] ? (
          <ResourceLink
            kind={pipelineReference}
            name={obj.metadata.labels['tekton.dev/pipeline']}
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
          kind={taskReference}
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
      <Status status={taskRunFilterReducer(obj)} />
    </TableData>
    <TableData className={tableColumnClasses[6]}>
      <Timestamp timestamp={obj?.status?.startTime} />
    </TableData>
    <TableData className={tableColumnClasses[7]}>
      <ResourceKebab actions={Kebab.factory.common} kind={taskRunsReference} resource={obj} />
    </TableData>
  </TableRow>
);

export default TaskRunsRow;
