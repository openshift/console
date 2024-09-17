import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { LoadingInline, resourcePathFromModel } from '@console/internal/components/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { FLAG_PIPELINES_OPERATOR_VERSION_1_16 } from '../../pipelines/const';
import { useTaskRuns } from '../hooks/useTaskRuns';
import LogSnippetBlock from '../logs/LogSnippetBlock';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import './StatusPopoverContent.scss';

type StatusPopoverContentProps = {
  pipelineRun: PipelineRunKind;
};
const PipelineRunStatusPopoverContent: React.FC<StatusPopoverContentProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  const IS_PIPELINE_OPERATOR_VERSION_1_16 = useFlag(FLAG_PIPELINES_OPERATOR_VERSION_1_16);
  const [PLRTaskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun.metadata.namespace,
    pipelineRun.metadata.name,
    undefined,
    undefined,
    IS_PIPELINE_OPERATOR_VERSION_1_16,
  );

  if (!taskRunsLoaded) {
    return (
      <div style={{ minHeight: '300px' }}>
        <LoadingInline />
      </div>
    );
  }

  const logDetails = getPLRLogSnippet(pipelineRun, PLRTaskRuns);

  return (
    <div className="odc-statuspopover-content" style={{ minHeight: '300px' }}>
      <LogSnippetBlock logDetails={logDetails} namespace={pipelineRun.metadata.namespace}>
        {(logSnippet: string) => (
          <>
            <pre className="co-pre">{logSnippet}</pre>
            <Link
              to={`${resourcePathFromModel(
                PipelineRunModel,
                pipelineRun.metadata.name,
                pipelineRun.metadata.namespace,
              )}/logs`}
            >
              {t('pipelines-plugin~View logs')}
            </Link>
          </>
        )}
      </LogSnippetBlock>
    </div>
  );
};

export default PipelineRunStatusPopoverContent;
