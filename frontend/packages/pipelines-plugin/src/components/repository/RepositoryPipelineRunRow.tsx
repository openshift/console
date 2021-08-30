import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  ResourceLink,
  Timestamp,
  truncateMiddle,
  ExternalLink,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import { pipelineRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../utils/pipeline-utils';
import LinkedPipelineRunTaskStatus from '../pipelineruns/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../pipelineruns/status/PipelineRunStatus';
import { ResourceKebabWithUserLabel } from '../pipelineruns/triggered-by';
import {
  RepositoryLabels,
  RepositoryFields,
  RepoAnnotationFields,
  RepositoryAnnotations,
} from './consts';
import { tableColumnClasses } from './RepositoryPipelineRunHeader';

const pipelinerunReference = referenceForModel(PipelineRunModel);

type PLRStatusProps = {
  obj: PipelineRunKind;
};

const PLRStatus: React.FC<PLRStatusProps> = ({ obj }) => {
  return (
    <PipelineRunStatus
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunFilterReducer(obj)}
      pipelineRun={obj}
    />
  );
};

const RepositoryPipelineRunRow: React.FC<RowFunctionArgs<PipelineRunKind>> = ({ obj }) => {
  const plrLabels = obj.metadata.labels;
  const plrAnnotations = obj.metadata.annotations;

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
      <TableData className={tableColumnClasses[1]} columnID="sha">
        <Tooltip
          content={
            <>
              {plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_MESSAGE]] ??
                plrLabels?.[RepositoryLabels[RepositoryFields.SHA]]}
            </>
          }
        >
          <ExternalLink
            href={plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_URL]]}
          >
            {truncateMiddle(plrLabels[RepositoryLabels[RepositoryFields.SHA]], {
              length: 7,
              truncateEnd: true,
              omission: '',
            })}
          </ExternalLink>
        </Tooltip>
      </TableData>
      <TableData className={tableColumnClasses[2]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <PLRStatus obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <LinkedPipelineRunTaskStatus pipelineRun={obj} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>{pipelineRunDuration(obj)}</TableData>
      <TableData className={tableColumnClasses[7]}>
        {plrLabels?.[RepositoryLabels[RepositoryFields.BRANCH]]}
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebabWithUserLabel
          actions={getPipelineRunKebabActions()}
          kind={pipelinerunReference}
          resource={obj}
        />
      </TableData>
    </>
  );
};

export default RepositoryPipelineRunRow;
