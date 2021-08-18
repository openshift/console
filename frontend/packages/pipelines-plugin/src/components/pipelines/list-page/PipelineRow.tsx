import * as React from 'react';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel, PipelineRunModel } from '../../../models';
import { PipelineWithLatest } from '../../../types';
import { pipelineFilterReducer } from '../../../utils/pipeline-filter-reducer';
import LinkedPipelineRunTaskStatus from '../../pipelineruns/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../../pipelineruns/status/PipelineRunStatus';
import { tableColumnClasses } from './pipeline-table';
import PipelineRowKebabActions from './PipelineRowKebabActions';

const pipelineReference = referenceForModel(PipelineModel);
const pipelinerunReference = referenceForModel(PipelineRunModel);

type PipelineStatusProps = {
  obj: PipelineWithLatest;
};

const PipelineStatus: React.FC<PipelineStatusProps> = ({ obj }) => {
  return (
    <PipelineRunStatus
      status={pipelineFilterReducer(obj)}
      title={pipelineFilterReducer(obj)}
      pipelineRun={obj.latestRun}
    />
  );
};

const PipelineRow: React.FC<RowFunctionArgs<PipelineWithLatest>> = ({ obj }) => {
  return (
    <React.Fragment data-test-id={`${obj.metadata.namespace}-${obj.metadata.name}`}>
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
        {obj.latestRun ? <LinkedPipelineRunTaskStatus pipelineRun={obj.latestRun} /> : '-'}
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
    </React.Fragment>
  );
};

export default PipelineRow;
