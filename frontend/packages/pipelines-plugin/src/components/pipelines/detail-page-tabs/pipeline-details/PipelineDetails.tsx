import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TriggerTemplateModel } from '../../../../models';
import { PipelineKind, PipelineTask } from '../../../../types';
import { getResourceModelFromTaskKind } from '../../../../utils/pipeline-augment';
import WorkspaceDefinitionList from '../../../shared/workspaces/WorkspaceDefinitionList';
import { RouteTemplate } from '../../utils/triggers';
import DynamicResourceLinkList from '../../resource-overview/DynamicResourceLinkList';
import TriggerTemplateResourceLink from '../../resource-overview/TriggerTemplateResourceLink';
import PipelineVisualization from './PipelineVisualization';

interface PipelineDetailsProps {
  obj: PipelineKind;
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
      <SectionHeading text={t('pipelines-plugin~Pipeline details')} />
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
            title={t('pipelines-plugin~Tasks')}
          />
          <WorkspaceDefinitionList workspaces={pipeline.spec.workspaces} />
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
