import * as React from 'react';
import { Status } from '@console/shared';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { Pipeline } from '../../../utils/pipeline-augment';
import { PipelineModel, PipelineRunModel } from '../../../models';
import LinkedPipelineRunTaskStatus from '../../pipelineruns/status/LinkedPipelineRunTaskStatus';
import { tableColumnClasses } from './pipeline-table';
import PipelineRowKebabActions from './PipelineRowKebabActions';

const pipelineReference = referenceForModel(PipelineModel);
const pipelinerunReference = referenceForModel(PipelineRunModel);

const PipelineRow: RowFunction<Pipeline> = ({ obj, index, key, style }) => {
  return (
    <TableRow
      id={obj.metadata.uid}
      data-test-id={`${obj.metadata.namespace}-${obj.metadata.name}`}
      index={index}
      trKey={key}
      style={style}
    >
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnId="namespace">
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
          <LinkedPipelineRunTaskStatus pipeline={obj} pipelineRun={obj.latestRun} />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Status status={pipelineFilterReducer(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {(obj.latestRun && obj.latestRun.status && obj.latestRun.status.completionTime && (
          <Timestamp timestamp={obj.latestRun.status.completionTime} />
        )) ||
          '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <PipelineRowKebabActions pipeline={obj} />
      </TableData>
    </TableRow>
  );
};

export default PipelineRow;
