import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import {
  getResourceModelFromTaskKind,
  Pipeline,
  PipelineTask,
  PipelineTaskRef,
} from '../../../../utils/pipeline-augment';
import { TriggerTemplateModel } from '../../../../models';
import { usePipelineTriggerTemplateNames, RouteTemplate } from '../../utils/triggers';
import DynamicResourceLinkList from '../../resource-overview/DynamicResourceLinkList';
import TriggerTemplateResourceLink from '../../resource-overview/TriggerTemplateResourceLink';
import PipelineVisualization from './PipelineVisualization';

interface PipelineDetailsProps {
  obj: Pipeline;
}

const PipelineDetails: React.FC<PipelineDetailsProps> = ({ obj: pipeline }) => {
  const routeTemplates: RouteTemplate[] = usePipelineTriggerTemplateNames(pipeline) || [];
  const taskLinks = pipeline.spec.tasks
    .map((task: PipelineTask) => task.taskRef)
    .filter((ref) => !!ref)
    .map((taskRef: PipelineTaskRef) => ({
      model: getResourceModelFromTaskKind(taskRef.kind),
      name: taskRef.name,
    }));
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
          <DynamicResourceLinkList
            namespace={pipeline.metadata.namespace}
            links={taskLinks}
            title="Tasks"
          />
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
