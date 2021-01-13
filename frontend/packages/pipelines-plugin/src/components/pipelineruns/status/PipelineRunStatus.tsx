import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { DASH } from '@console/shared';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import { PipelineRunModel } from '../../../models';
import PipelineResourceStatus from './PipelineResourceStatus';
import StatusPopoverContent from './StatusPopoverContent';

type PipelineRunStatusProps = {
  status: string;
  pipelineRun: PipelineRun;
  title?: string;
};
const PipelineRunStatus: React.FC<PipelineRunStatusProps> = ({ status, pipelineRun, title }) => {
  const { t } = useTranslation();
  return pipelineRun ? (
    <PipelineResourceStatus status={status} title={title}>
      <StatusPopoverContent
        logDetails={getPLRLogSnippet(pipelineRun, t)}
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
    <>{DASH}</>
  );
};

export default PipelineRunStatus;
