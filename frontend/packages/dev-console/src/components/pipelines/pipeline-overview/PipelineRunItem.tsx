import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { resourcePath } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { fromNow } from '@console/internal/components/utils/datetime';
import { pipelineRunStatus } from '../../../utils/pipeline-filter-reducer';
import { PipelineRunModel } from '../../../models';
import { PipelineRun } from '../../../utils/pipeline-augment';

type PipelineRunItemProps = {
  pipelineRun: PipelineRun;
};

const PipelineRunItem: React.FC<PipelineRunItemProps> = ({ pipelineRun }) => {
  const {
    metadata: { name, namespace, creationTimestamp },
    status,
  } = pipelineRun;
  const path = resourcePath(referenceForModel(PipelineRunModel), name, namespace);
  const lastUpdated = status
    ? status.completionTime || status.startTime || creationTimestamp
    : creationTimestamp;
  return (
    <li className="list-group-item">
      <Grid hasGutter>
        <GridItem span={6}>
          <Link to={`${path}`}>{name}</Link>
          {lastUpdated && <span className="text-muted">&nbsp;({fromNow(lastUpdated)})</span>}
        </GridItem>
        <GridItem span={3}>
          <Status status={pipelineRunStatus(pipelineRun) || 'Pending'} />
        </GridItem>
        <GridItem span={3} className="text-right">
          <Link to={`${path}/logs`}>View logs</Link>
        </GridItem>
      </Grid>
    </li>
  );
};

export default PipelineRunItem;
