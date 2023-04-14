import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LoadingInline, resourcePathFromModel } from '@console/internal/components/utils';
import { DASH } from '@console/shared';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { useTaskRuns } from '../../taskruns/useTaskRuns';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import PipelineResourceStatus from './PipelineResourceStatus';
import StatusPopoverContent from './StatusPopoverContent';

type PipelineRunStatusProps = {
  status: string;
  pipelineRun: PipelineRunKind;
  title?: string;
};
const PipelineRunStatus: React.FC<PipelineRunStatusProps> = ({ status, pipelineRun, title }) => {
  const { t } = useTranslation();
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
  );
  return pipelineRun ? (
    taskRunsLoaded ? (
      <PipelineResourceStatus status={status} title={title}>
        <StatusPopoverContent
          logDetails={getPLRLogSnippet(pipelineRun, taskRuns)}
          namespace={pipelineRun.metadata.namespace}
          link={
            <Link
              to={`${resourcePathFromModel(
                PipelineRunModel,
                pipelineRun.metadata.name,
                pipelineRun.metadata.namespace,
              )}/logs`}
            >
              {t('pipelines-plugin~View logs')}
            </Link>
          }
        />
      </PipelineResourceStatus>
    ) : (
      <LoadingInline />
    )
  ) : (
    <>{DASH}</>
  );
};

export default PipelineRunStatus;
