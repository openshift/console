import * as React from 'react';

import { Status } from '@console/shared';
import { VirtualTableRow, VirtualTableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, Timestamp, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import { reRunPipelineRun, stopPipelineRun } from '../../utils/pipeline-actions';
import { PipelineTaskStatus } from './PipelineTaskStatus';
import { PipelineRun } from '../../utils/pipeline-augment';
import { tableColumnClasses } from './pipelinerun-table';
import { PipelineRunModel } from '../../models';

const pipelinerunReference = referenceForModel(PipelineRunModel);

interface PipelineRunRowProps {
  obj: PipelineRun;
  index: number;
  key?: string;
  style: object;
}

const PipelineRunRow: React.FC<PipelineRunRowProps> = ({ obj, index, key, style }) => {
  const menuActions = [reRunPipelineRun(obj), stopPipelineRun(obj), ...Kebab.factory.common];
  return (
    <VirtualTableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelinerunReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[1]}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[2]}>
        <Status status={pipelineRunFilterReducer(obj)} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[3]}>
        <PipelineTaskStatus pipelinerun={obj} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[4]}>-</VirtualTableData>
      <VirtualTableData className={tableColumnClasses[5]}>
        {obj.spec && obj.spec.trigger && obj.spec.trigger.type ? obj.spec.trigger.type : '-'}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={pipelinerunReference} resource={obj} />
      </VirtualTableData>
    </VirtualTableRow>
  );
};

export default PipelineRunRow;
