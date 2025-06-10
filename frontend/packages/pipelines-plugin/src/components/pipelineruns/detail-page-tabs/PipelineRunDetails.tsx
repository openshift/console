import * as React from 'react';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PipelineRunKind } from '../../../types';
import PipelineRunDetailsSection from './PipelineRunDetailsSection';

export interface PipelineRunDetailsProps {
  obj: PipelineRunKind;
}

export const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({ obj: pipelineRun }) => {
  return (
    <PaneBody className="odc-pipeline-run-details">
      <PipelineRunDetailsSection pipelineRun={pipelineRun} />
    </PaneBody>
  );
};
