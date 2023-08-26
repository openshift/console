import * as React from 'react';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { getPipelineRunKebabActions } from '../../../utils/pipeline-actions';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../../utils/pipeline-utils';
import LinkedPipelineRunTaskStatus from '../status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../status/PipelineRunStatus';
import { ResourceKebabWithUserLabel } from '../triggered-by';
import { tableColumnClasses } from './pipelinerun-table';

const pipelinerunReference = referenceForModel(PipelineRunModel);

type PLRStatusProps = {
  obj: PipelineRunKind;
};

const PLRStatus: React.FC<PLRStatusProps> = ({ obj }) => {
  return (
    <PipelineRunStatus
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
    />
  );
};

const PipelineRunRow: React.FC<RowFunctionArgs<PipelineRunKind>> = ({
  obj,
  customData: operatorVersion,
}) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelinerunReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          data-test-id={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <PLRStatus obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LinkedPipelineRunTaskStatus pipelineRun={obj} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>{pipelineRunDuration(obj)}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebabWithUserLabel
          actions={getPipelineRunKebabActions(operatorVersion)}
          kind={pipelinerunReference}
          resource={obj}
        />
      </TableData>
    </>
  );
};

export default PipelineRunRow;
