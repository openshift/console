import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp, Kebab, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskRunKind } from '../../../utils/pipeline-augment';
import { TaskRunModel } from '../../../models';
import { tableColumnClasses } from './taskruns-table';
import { Status } from '@console/shared';
import { pipelineRunFilterReducer as taskRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { pipelineRunDuration as taskRunDuration } from '../../../utils/pipeline-utils';

const TaskRunsRow: RowFunction<TaskRunKind> = ({ obj, index, key, style }) => {
  const taskRunsReference = referenceForModel(TaskRunModel);
  return (
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
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={taskRunFilterReducer(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj?.status?.startTime} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{taskRunDuration(obj)}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={Kebab.factory.common} kind={taskRunsReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default TaskRunsRow;
