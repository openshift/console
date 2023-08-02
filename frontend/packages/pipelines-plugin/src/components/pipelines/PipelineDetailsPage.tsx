import * as React from 'react';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { KebabAction, navFactory, LoadingBox } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { PipelineModel } from '../../models';
import { PipelineKind } from '../../types';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { getPipelineKebabActions } from '../../utils/pipeline-actions';
import { useMenuActionsWithUserAnnotation } from '../pipelineruns/triggered-by';
import {
  PipelineDetails,
  PipelineForm,
  PipelineParametersForm,
  PipelineRuns,
  parametersValidationSchema,
} from './detail-page-tabs';
import { PipelineDetailsTabProps } from './detail-page-tabs/types';
import { useDevPipelinesBreadcrumbsFor, useLatestPipelineRun } from './hooks';
import { usePipelineMetricsLevel } from './utils/pipeline-operator';
import { usePipelineTriggerTemplateNames } from './utils/triggers';

const PipelineDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { name, namespace, kindObj } = props;
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];
  const breadcrumbsFor = useDevPipelinesBreadcrumbsFor(kindObj);
  const [, pipelineLoaded, pipelineError] = useK8sGet<PipelineKind>(PipelineModel, name, namespace);
  const latestPipelineRun = useLatestPipelineRun(name, namespace);
  const badge = usePipelineTechPreviewBadge(namespace);
  const { hasUpdatePermission, queryPrefix, metricsLevel } = usePipelineMetricsLevel(namespace);

  const augmentedMenuActions: KebabAction[] = useMenuActionsWithUserAnnotation(
    getPipelineKebabActions(latestPipelineRun, templateNames.length > 0),
  );
  if (pipelineLoaded && pipelineError?.response?.status === 404) {
    return <ErrorPage404 />;
  }
  return pipelineLoaded ? (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={augmentedMenuActions}
      customData={{ templateNames, queryPrefix, metricsLevel, hasUpdatePermission }}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[
        navFactory.details(PipelineDetails),
        navFactory.editYaml(),
        {
          href: 'Runs',
          // t('pipelines-plugin~PipelineRuns')
          nameKey: 'pipelines-plugin~PipelineRuns',
          component: PipelineRuns,
        },
        {
          href: 'parameters',
          // t('pipelines-plugin~Parameters')
          nameKey: 'pipelines-plugin~Parameters',
          component: (pageProps: PipelineDetailsTabProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineParametersForm}
              formName="parameters"
              validationSchema={parametersValidationSchema()}
              obj={pageProps.obj}
              {...pageProps}
            />
          ),
        },
      ]}
    />
  ) : (
    <LoadingBox />
  );
};

export default PipelineDetailsPage;
