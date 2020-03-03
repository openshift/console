import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PipelineRunVisualization from './PipelineRunVisualization';
import { PipelineRun } from '../../../utils/pipeline-augment';

export interface PipelineRunDetailsProps {
  obj: PipelineRun;
}

export const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({ obj: pipelineRun }) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Pipeline Run Details" />
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pipelineRun} />
        </div>
      </div>
    </div>
  );
};
