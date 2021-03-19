import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TriggerTemplateModel } from '../../../../models';
import WorkspaceDefinitionList from '../../../shared/workspaces/WorkspaceDefinitionList';
import { PipelineKind } from '../../../../types';
import { RouteTemplate } from '../../utils/triggers';
import DynamicResourceLinkList from '../../resource-overview/DynamicResourceLinkList';
import TriggerTemplateResourceLink from '../../resource-overview/TriggerTemplateResourceLink';
import PipelineVisualization from './PipelineVisualization';
import { getPipelineTaskLinks } from '../utils';

interface PipelineDetailsProps {
  obj: PipelineKind;
  customData: RouteTemplate[];
}

const PipelineDetails: React.FC<PipelineDetailsProps> = ({
  obj: pipeline,
  customData: routeTemplates,
}) => {
  const { t } = useTranslation();
  const { taskLinks, finallyTaskLinks } = getPipelineTaskLinks(pipeline);

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
          <DynamicResourceLinkList
            namespace={pipeline.metadata.namespace}
            links={finallyTaskLinks}
            title={t('pipelines-plugin~Finally tasks')}
          />
          <WorkspaceDefinitionList workspaces={pipeline.spec.workspaces} />
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
