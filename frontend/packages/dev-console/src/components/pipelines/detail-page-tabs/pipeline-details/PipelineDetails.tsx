import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { Pipeline } from '../../../../utils/pipeline-augment';
import { TriggerTemplateModel, TaskModel } from '../../../../models';
import { usePipelineTriggerTemplateNames, RouteTemplate } from '../../utils/triggers';
import TriggerTemplateResourceLink from '../../resource-overview/TriggerTemplateResourceLink';
import ResourceLinkList from '../../resource-overview/ResourceLinkList';
import PipelineVisualization from './PipelineVisualization';

interface PipelineDetailsProps {
  obj: Pipeline;
}

const PipelineDetails: React.FC<PipelineDetailsProps> = ({ obj: pipeline }) => {
  const routeTemplates: RouteTemplate[] = usePipelineTriggerTemplateNames(pipeline) || [];
  const pipelineTasks = pipeline.spec.tasks.map((task) => task.taskRef.name);
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Pipeline Details" />
      <PipelineVisualization pipeline={pipeline} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pipeline} />
        </div>
        <div className="col-sm-6">
          <TriggerTemplateResourceLink
            namespace={pipeline.metadata.namespace}
            model={TriggerTemplateModel}
            links={routeTemplates}
          />
          <ResourceLinkList
            namespace={pipeline.metadata.namespace}
            links={pipelineTasks}
            model={TaskModel}
          />
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
