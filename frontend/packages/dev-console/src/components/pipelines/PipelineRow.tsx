import * as React from 'react';

import { Status } from '@console/shared';
import { VirtualTableRow, VirtualTableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, Timestamp, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineFilterReducer } from '../../utils/pipeline-filter-reducer';
import { Pipeline } from '../../utils/pipeline-augment';
import { PipelineTaskStatus } from '../pipelineruns/PipelineTaskStatus';
import { tableColumnClasses } from './pipeline-table';
import { PipelineModel, PipelineRunModel } from '../../models';
import { triggerPipeline, rerunPipeline } from '../../utils/pipeline-actions';

const pipelineReference = referenceForModel(PipelineModel);
const pipelinerunReference = referenceForModel(PipelineRunModel);

interface PipelineRowProps {
  obj: Pipeline;
  index: number;
  key?: string;
  style: object;
}

const PipelineRow: React.FC<PipelineRowProps> = ({ obj, index, key, style }) => {
  const menuActions = [
    triggerPipeline(obj, obj.latestRun, ''),
    rerunPipeline(obj, obj.latestRun, ''),
    ...Kebab.factory.common,
  ];
  return (
    <VirtualTableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[1]}>
        {obj.latestRun && obj.latestRun.metadata && obj.latestRun.metadata.name ? (
          <ResourceLink
            kind={pipelinerunReference}
            name={obj.latestRun.metadata.name}
            namespace={obj.latestRun.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[2]}>
        <Status status={pipelineFilterReducer(obj)} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[3]}>
        {(obj.latestRun && <PipelineTaskStatus pipeline={obj} pipelinerun={obj.latestRun} />) ||
          '-'}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[4]}>
        {(obj.latestRun && obj.latestRun.status && obj.latestRun.status.completionTime && (
          <Timestamp timestamp={obj.latestRun.status.completionTime} />
        )) ||
          '-'}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={pipelineReference} resource={obj} />
      </VirtualTableData>
    </VirtualTableRow>
  );
};

export default PipelineRow;
