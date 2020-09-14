import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { KebabAction, navFactory } from '@console/internal/components/utils';
import { k8sGet, k8sList } from '@console/internal/module/k8s';
import { ErrorPage404 } from '@console/internal/components/error';
import { getPipelineKebabActions } from '../../utils/pipeline-actions';
import { getLatestRun, PipelineRun } from '../../utils/pipeline-augment';
import { PipelineRunModel, PipelineModel } from '../../models';
import { useMenuActionsWithUserLabel } from '../pipelineruns/triggered-by';
import {
  PipelineDetails,
  PipelineForm,
  PipelineParametersForm,
  PipelineResourcesForm,
  PipelineRuns,
  parametersValidationSchema,
  resourcesValidationSchema,
} from './detail-page-tabs';
import { usePipelineTriggerTemplateNames } from './utils/triggers';
import { usePipelinesBreadcrumbsFor } from './hooks';

const PipelineDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const [errorCode, setErrorCode] = React.useState(null);
  const [latestPipelineRun, setLatestPipelineRun] = React.useState<PipelineRun>({});
  const { name, namespace, kindObj, match } = props;
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];
  const breadcrumbsFor = usePipelinesBreadcrumbsFor(kindObj, match);

  React.useEffect(() => {
    k8sGet(PipelineModel, name, namespace)
      .then((res) => {
        // eslint-disable-next-line promise/no-nesting
        k8sList(PipelineRunModel, {
          ns: namespace,
          labelSelector: { 'tekton.dev/pipeline': res.metadata.name },
        })
          .then((listres) => {
            const latestRun = getLatestRun({ data: listres }, 'creationTimestamp');
            setLatestPipelineRun(latestRun);
          })
          .catch((error) => {
            setErrorCode(error.response.status);
          });
      })
      .catch((error) => setErrorCode(error.response.status));
  }, [name, namespace]);

  const augmentedMenuActions: KebabAction[] = useMenuActionsWithUserLabel(
    getPipelineKebabActions(latestPipelineRun, templateNames.length > 0),
  );

  if (errorCode === 404) {
    return <ErrorPage404 />;
  }
  return (
    <DetailsPage
      {...props}
      menuActions={augmentedMenuActions}
      customData={templateNames}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[
        navFactory.details(PipelineDetails),
        navFactory.editYaml(),
        {
          href: 'Runs',
          name: 'Pipeline Runs',
          component: PipelineRuns,
        },
        {
          href: 'parameters',
          name: 'Parameters',
          component: (pageProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineParametersForm}
              formName="parameters"
              validationSchema={parametersValidationSchema}
              obj={pageProps.obj}
              {...pageProps}
            />
          ),
        },
        {
          href: 'resources',
          name: 'Resources',
          component: (pageProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineResourcesForm}
              formName="resources"
              validationSchema={resourcesValidationSchema}
              obj={pageProps.obj}
              {...pageProps}
            />
          ),
        },
      ]}
    />
  );
};

export default PipelineDetailsPage;
