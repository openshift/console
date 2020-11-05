import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import {
  getResourceModelFromTaskKind,
  Pipeline,
  PipelineTask,
} from '../../../../utils/pipeline-augment';
import { TriggerTemplateModel } from '../../../../models';
import { RouteTemplate } from '../../utils/triggers';
import DynamicResourceLinkList from '../../resource-overview/DynamicResourceLinkList';
import TriggerTemplateResourceLink from '../../resource-overview/TriggerTemplateResourceLink';
import PipelineVisualization from './PipelineVisualization';

interface PipelineDetailsProps {
  obj: Pipeline;
  customData: RouteTemplate[];
}

const PipelineDetails: React.FC<PipelineDetailsProps> = ({
  obj: pipeline,
  customData: routeTemplates,
}) => {
  const { t } = useTranslation();
  const taskLinks = pipeline.spec.tasks
    .filter((pipelineTask: PipelineTask) => !!pipelineTask.taskRef)
    .map((task) => ({
      model: getResourceModelFromTaskKind(task.taskRef.kind),
      name: task.taskRef.name,
      displayName: task.name,
    }));
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('devconsole~Pipeline Details')} />
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
            title={t('devconsole~Tasks')}
          />
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
