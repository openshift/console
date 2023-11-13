import * as React from 'react';
import { PipelineRunKind } from '../../../types';
import PipelineRunDetailsSection from './PipelineRunDetailsSection';
import './TriggeredBySection.scss';

export interface PipelineRunDetailsProps {
  obj: PipelineRunKind;
}

export const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({ obj: pipelineRun }) => {
  return (
    <div className="co-m-pane__body odc-pipeline-run-details">
      <PipelineRunDetailsSection pipelineRun={pipelineRun} />
    </div>
  );
};
