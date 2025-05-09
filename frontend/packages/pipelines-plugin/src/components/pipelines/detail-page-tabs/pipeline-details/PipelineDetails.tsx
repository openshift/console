import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { TriggerTemplateModel } from '../../../../models';
import WorkspaceDefinitionList from '../../../shared/workspaces/WorkspaceDefinitionList';
import DynamicResourceLinkList from '../../resource-overview/DynamicResourceLinkList';
import TriggerTemplateResourceLink from '../../resource-overview/TriggerTemplateResourceLink';
import { PipelineDetailsTabProps } from '../types';
import { getPipelineTaskLinks } from '../utils';
import PipelineVisualization from './PipelineVisualization';

const PipelineDetails: React.FC<PipelineDetailsTabProps> = ({ obj: pipeline, customData }) => {
  const { t } = useTranslation();
  const { taskLinks, finallyTaskLinks } = getPipelineTaskLinks(pipeline);

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('pipelines-plugin~Pipeline details')} />
        <PipelineVisualization pipeline={pipeline} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={pipeline} />
          </GridItem>
          <GridItem sm={6}>
            <TriggerTemplateResourceLink
              namespace={pipeline.metadata.namespace}
              model={TriggerTemplateModel}
              links={customData.templateNames}
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
          </GridItem>
        </Grid>
      </PaneBody>
    </>
  );
};

export default PipelineDetails;
