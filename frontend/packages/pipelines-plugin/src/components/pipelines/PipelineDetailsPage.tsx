import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { KebabAction, navFactory, LoadingBox } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ErrorPage404 } from '@console/internal/components/error';
import { getPipelineKebabActions } from '../../utils/pipeline-actions';
import { Pipeline } from '../../utils/pipeline-augment';
import { PipelineModel } from '../../models';
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
import PipelineMetrics from './pipeline-metrics/PipelineMetrics';
import { usePipelineTriggerTemplateNames } from './utils/triggers';
import { usePipelinesBreadcrumbsFor, useLatestPipelineRun } from './hooks';

const PipelineDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { name, namespace, kindObj, match } = props;
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];
  const breadcrumbsFor = usePipelinesBreadcrumbsFor(kindObj, match);
  const [, pipelineLoaded, pipelineError] = useK8sGet<Pipeline>(PipelineModel, name, namespace);
  const latestPipelineRun = useLatestPipelineRun(name, namespace);

  const augmentedMenuActions: KebabAction[] = useMenuActionsWithUserAnnotation(
    getPipelineKebabActions(latestPipelineRun, templateNames.length > 0),
  );
  if (pipelineLoaded && pipelineError?.response?.status === 404) {
    return <ErrorPage404 />;
  }
  return pipelineLoaded ? (
    <DetailsPage
      {...props}
      menuActions={augmentedMenuActions}
      customData={templateNames}
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
          name: t('pipelines-plugin~Pipeline Runs'),
          component: PipelineRuns,
        },
        {
          href: 'parameters',
          name: t('pipelines-plugin~Parameters'),
          component: (pageProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineParametersForm}
              formName="parameters"
              validationSchema={parametersValidationSchema(t)}
              obj={pageProps.obj}
              {...pageProps}
            />
          ),
        },
        {
          href: 'resources',
          name: t('pipelines-plugin~Resources'),
          component: (pageProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineResourcesForm}
              formName="resources"
              validationSchema={resourcesValidationSchema(t)}
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
