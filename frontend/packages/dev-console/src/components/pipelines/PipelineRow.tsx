import * as React from 'react';
import { TableRow, TableData } from '@console/internal/components/factory';
import {
  Kebab,
  ResourceLink,
  StatusIcon,
  Timestamp,
  ResourceKebab,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineFilterReducer } from '../../utils/pipeline-filter-reducer';
import { Pipeline } from '../../utils/pipeline-augment';
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
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
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
      <TableData className={tableColumnClasses[2]}>
        <StatusIcon status={pipelineFilterReducer(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>-</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp
          timestamp={obj.latestRun && obj.latestRun.status && obj.latestRun.status.completionTime}
        />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={pipelineReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default PipelineRow;
