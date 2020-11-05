import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
import { getPLRLogSnippet } from '../../pipelineruns/logs/pipelineRunLogSnippet';
import './PipelineRunItem.scss';

type PipelineRunItemProps = {
  pipelineRun: PipelineRun;
};

const PipelineRunItem: React.FC<PipelineRunItemProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  const {
    metadata: { name, namespace, creationTimestamp },
    status,
  } = pipelineRun;
  const path = resourcePath(referenceForModel(PipelineRunModel), name, namespace);
  const lastUpdated = status
    ? status.completionTime || status.startTime || creationTimestamp
    : creationTimestamp;
  const logDetails = getPLRLogSnippet(pipelineRun);

  return (
    <li className="odc-pipeline-run-item list-group-item">
      <Grid hasGutter>
        <GridItem span={6}>
          <div>
            <Link to={`${path}`}>{name}</Link>
            {lastUpdated && (
              <>
                {' '}
                <span className="odc-pipeline-run-item__time text-muted">
                  ({fromNow(lastUpdated)})
                </span>
              </>
            )}
          </div>
        </GridItem>
        <GridItem span={3}>
          <Status status={pipelineRunStatus(pipelineRun) || 'Pending'} />
        </GridItem>
        <GridItem span={3} className="text-right">
          <Link to={`${path}/logs`}>{t('devconsole~View logs')}</Link>
        </GridItem>
        {logDetails && (
          <GridItem span={12}>
            <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
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
