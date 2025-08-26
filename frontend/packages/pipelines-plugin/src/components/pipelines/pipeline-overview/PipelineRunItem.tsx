import * as React from 'react';
import { Grid, GridItem, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { resourcePath } from '@console/internal/components/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { referenceForModel } from '@console/internal/module/k8s';
import { LogSnippet, Status } from '@console/shared';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-filter-reducer';
import LogSnippetBlock from '../../pipelineruns/logs/LogSnippetBlock';
import { getPLRLogSnippet } from '../../pipelineruns/logs/pipelineRunLogSnippet';
import './PipelineRunItem.scss';
import { useTaskRuns } from '../../taskruns/useTaskRuns';

type PipelineRunItemProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunItem: React.FC<PipelineRunItemProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  const {
    metadata: { name, namespace, creationTimestamp },
    status,
  } = pipelineRun;
  const [taskRuns] = useTaskRuns(pipelineRun?.metadata?.namespace, pipelineRun?.metadata?.name);
  const path = resourcePath(referenceForModel(PipelineRunModel), name, namespace);
  const lastUpdated = status
    ? status.completionTime || status.startTime || creationTimestamp
    : creationTimestamp;
  const logDetails = getPLRLogSnippet(pipelineRun, taskRuns);

  return (
    <ListItem className="odc-pipeline-run-item">
      <Grid hasGutter>
        <GridItem span={6}>
          <div>
            <Link to={`${path}`}>{name}</Link>
            {lastUpdated && (
              <>
                {' '}
                <span className="odc-pipeline-run-item__time pf-v6-u-text-color-subtle">
                  ({fromNow(typeof lastUpdated === 'string' ? lastUpdated : lastUpdated.toString())}
                  )
                </span>
              </>
            )}
          </div>
        </GridItem>
        <GridItem span={3}>
          <Status status={pipelineRunStatus(pipelineRun) || 'Pending'} />
        </GridItem>
        <GridItem span={3} className="pf-v6-u-text-align-right">
          <Link to={`${path}/logs`}>{t('pipelines-plugin~View logs')}</Link>
        </GridItem>
        {logDetails && (
          <GridItem>
            <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
              {(logSnippet: string) => (
                <LogSnippet message={logDetails.title} logSnippet={logSnippet} />
              )}
            </LogSnippetBlock>
          </GridItem>
        )}
      </Grid>
    </ListItem>
  );
};

export default PipelineRunItem;
