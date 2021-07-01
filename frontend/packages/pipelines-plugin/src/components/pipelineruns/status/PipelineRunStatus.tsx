import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DASH } from '@console/dynamic-plugin-sdk';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
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
  return pipelineRun ? (
    <PipelineResourceStatus status={status} title={title}>
      <StatusPopoverContent
        logDetails={getPLRLogSnippet(pipelineRun)}
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
