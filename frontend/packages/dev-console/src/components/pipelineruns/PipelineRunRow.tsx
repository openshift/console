import * as React from 'react';
import * as _ from 'lodash';
import { Status } from '@console/shared';
import { TableRow, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, Timestamp, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import { reRunPipelineRun, stopPipelineRun } from '../../utils/pipeline-actions';
import { PipelineRun } from '../../utils/pipeline-augment';
import { PipelineRunModel } from '../../models';
import { tableColumnClasses } from './pipelinerun-table';
import LinkedPipelineRunTaskStatus from './LinkedPipelineRunTaskStatus';

const pipelinerunReference = referenceForModel(PipelineRunModel);

interface PipelineRunRowProps {
  obj: PipelineRun;
  index: number;
  key?: string;
  style: object;
}

const PipelineRunRow: React.FC<PipelineRunRowProps> = ({ obj, index, key, style }) => {
  const pipelineRunStatus = pipelineRunFilterReducer(obj);

  const menuActions = [
    reRunPipelineRun,
    ...(obj && pipelineRunStatus === 'Running' ? [stopPipelineRun] : []),
    Kebab.factory.Delete,
  ];

  const pipelineRunDuration = () => {
    const startTime = _.get(obj, ['status', 'startTime'], null);
    if (!startTime) {
      return '-';
    }
    const start = new Date(startTime).getTime();
    const completionTime = _.get(obj, ['status', 'completionTime'], null);
    const duration = completionTime
      ? (new Date(completionTime).getTime() - start) / 1000
      : (new Date().getTime() - start) / 1000;
    return duration < 60
      ? `${Math.floor(duration)}s`
      : `${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`;
  };

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
        <LinkedPipelineRunTaskStatus pipelineRun={obj} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{pipelineRunDuration()}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={pipelinerunReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default PipelineRunRow;
