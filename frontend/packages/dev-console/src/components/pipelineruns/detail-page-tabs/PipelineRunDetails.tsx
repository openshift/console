import * as React from 'react';
import { SectionHeading, ResourceSummary, ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import PipelineRunVisualization from './PipelineRunVisualization';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';

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
        <div className="col-sm-6">
          <dl>
            <dt>Pipeline</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(PipelineModel)}
                name={pipelineRun.spec.pipelineRef.name}
                namespace={pipelineRun.metadata.namespace}
              />
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};
