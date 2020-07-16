import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { resourcePath } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { LogSnippet, Status } from '@console/shared';
import { fromNow } from '@console/internal/components/utils/datetime';
import { pipelineRunStatus } from '../../../utils/pipeline-filter-reducer';
import { PipelineRunModel } from '../../../models';
import { PipelineRun } from '../../../utils/pipeline-augment';
import LogSnippetBlock from '../../pipelineruns/logs/LogSnippetBlock';
import { getLogSnippet } from '../../pipelineruns/logs/pipelineRunLogSnippet';

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
  const logDetails = getLogSnippet(pipelineRun);

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
        {logDetails && (
          <GridItem span={12}>
            <LogSnippetBlock logDetails={logDetails} pipelineRun={pipelineRun}>
              {(logSnippet: string) => (
                <LogSnippet message={logDetails.title} logSnippet={logSnippet} />
              )}
            </LogSnippetBlock>
          </GridItem>
        )}
      </Grid>
    </li>
  );
};

export default PipelineRunItem;
