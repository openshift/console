import * as React from 'react';
import { Status } from '@console/shared';
import { TableRow, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, Timestamp, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import { reRunPipelineRun, stopPipelineRun } from '../../utils/pipeline-actions';
import { PipelineRun } from '../../utils/pipeline-augment';
import { PipelineRunModel } from '../../models';
import { PipelineTaskStatus } from './PipelineTaskStatus';
import { tableColumnClasses } from './pipelinerun-table';

const pipelinerunReference = referenceForModel(PipelineRunModel);

interface PipelineRunRowProps {
  obj: PipelineRun;
  index: number;
  key?: string;
  style: object;
}

const PipelineRunRow: React.FC<PipelineRunRowProps> = ({ obj, index, key, style }) => {
  const menuActions = [reRunPipelineRun(obj), stopPipelineRun(obj), Kebab.factory.Delete];
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelinerunReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={pipelineRunFilterReducer(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <PipelineTaskStatus pipelinerun={obj} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>-</TableData>
      <TableData className={tableColumnClasses[5]}>
        {obj.spec && obj.spec.trigger && obj.spec.trigger.type ? obj.spec.trigger.type : '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={pipelinerunReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default PipelineRunRow;
