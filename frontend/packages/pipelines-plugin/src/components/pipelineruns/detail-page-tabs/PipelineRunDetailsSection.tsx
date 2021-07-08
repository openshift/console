import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { PipelineRunKind } from '../../../types';
import PipelineRunCustomDetails from './PipelineRunCustomDetails';
import PipelineRunVisualization from './PipelineRunVisualization';

export interface PipelineRunDetailsSectionProps {
  pipelineRun: PipelineRunKind;
}

const PipelineRunDetailsSection: React.FC<PipelineRunDetailsSectionProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading text={t('pipelines-plugin~PipelineRun details')} />
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pipelineRun} />
        </div>
        <div className="col-sm-6 odc-pipeline-run-details__customDetails">
          <PipelineRunCustomDetails pipelineRun={pipelineRun} />
        </div>
      </div>
    </>
  );
};

export default PipelineRunDetailsSection;
