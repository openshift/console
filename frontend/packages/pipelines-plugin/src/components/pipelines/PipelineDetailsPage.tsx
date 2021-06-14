import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  PipelineResourcesForm,
  PipelineRuns,
  parametersValidationSchema,
  resourcesValidationSchema,
} from './detail-page-tabs';
import { PipelineDetailsTabProps } from './detail-page-tabs/types';
import { usePipelinesBreadcrumbsFor, useLatestPipelineRun } from './hooks';
import { MetricsQueryPrefix } from './pipeline-metrics/pipeline-metrics-utils';
import PipelineMetrics from './pipeline-metrics/PipelineMetrics';
import { isGAVersionInstalled, usePipelineOperatorVersion } from './utils/pipeline-operator';
import { usePipelineTriggerTemplateNames } from './utils/triggers';

const PipelineDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { name, namespace, kindObj, match } = props;
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];
  const breadcrumbsFor = usePipelinesBreadcrumbsFor(kindObj, match);
  const [, pipelineLoaded, pipelineError] = useK8sGet<PipelineKind>(PipelineModel, name, namespace);
  const latestPipelineRun = useLatestPipelineRun(name, namespace);
  const pipelineOperator = usePipelineOperatorVersion(namespace);
  const badge = usePipelineTechPreviewBadge(namespace);
  const queryPrefix =
    pipelineOperator && !isGAVersionInstalled(pipelineOperator)
      ? MetricsQueryPrefix.TEKTON
      : MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER;

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
      customData={{ templateNames, queryPrefix }}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[
        navFactory.details(PipelineDetails),
        {
          href: 'metrics',
          name: t('pipelines-plugin~Metrics'),
          component: PipelineMetrics,
        },
        navFactory.editYaml(),
        {
          href: 'Runs',
          name: t('pipelines-plugin~PipelineRuns'),
          component: PipelineRuns,
        },
        {
          href: 'parameters',
          name: t('pipelines-plugin~Parameters'),
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
        {
          href: 'resources',
          name: t('pipelines-plugin~Resources'),
          component: (pageProps: PipelineDetailsTabProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineResourcesForm}
              formName="resources"
              validationSchema={resourcesValidationSchema()}
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
