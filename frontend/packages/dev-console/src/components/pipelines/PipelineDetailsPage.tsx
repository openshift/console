import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { viewYamlComponent } from '@console/internal/components//utils/horizontal-nav';
import { ErrorPage404 } from '@console/internal/components/error';
import { useSafeK8s } from '../../utils/safe-k8s-hook';
import { rerunPipeline } from '../../utils/pipeline-actions';
import { getLatestRun } from '../../utils/pipeline-augment';
import { PipelineRunModel, PipelineModel } from '../../models';
import PipelineDetails from './PipelineDetails';
import PipelineResources from './PipelineResources';
import PipelineParameters from './PipelineParameters';
import PipelineRuns from './PipelineRuns';
import PipelineForm from './pipeline-form/PipelineForm';

const PipelineDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const [menuActions, setMenuActions] = React.useState([]);
  const [errorCode, setErrorCode] = React.useState(null);

  const { name, namespace } = props;
  const { k8sGet, k8sList } = useSafeK8s();

  React.useEffect(() => {
    k8sGet(PipelineModel, name, namespace)
      .then((res) => {
        // eslint-disable-next-line promise/no-nesting
        k8sList(PipelineRunModel, {
          labelSelector: { 'tekton.dev/pipeline': res.metadata.name },
        })
          .then((listres) => {
            setMenuActions([
              rerunPipeline(res, getLatestRun({ data: listres }, 'creationTimestamp'), 'pipelines'),
              Kebab.factory.Delete,
            ]);
          })
          .catch((error) => setErrorCode(error.response.status));
      })
      .catch((error) => setErrorCode(error.response.status));
  }, [k8sGet, k8sList, name, namespace]);

  if (errorCode === 404) {
    return <ErrorPage404 />;
  }
  return (
    <DetailsPage
      {...props}
      menuActions={menuActions}
      pages={[
        navFactory.details(PipelineDetails),
        navFactory.editYaml(viewYamlComponent),
        {
          href: 'Runs',
          name: 'Pipeline Runs',
          component: PipelineRuns,
        },
        {
          href: 'parameters',
          name: 'Parameters',
          component: (componentProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineParameters}
              formName="parameters"
              {...componentProps}
            />
          ),
        },
        {
          href: 'resources',
          name: 'Resources',
          component: (componentProps) => (
            <PipelineForm
              PipelineFormComponent={PipelineResources}
              formName="resources"
              {...componentProps}
            />
          ),
        },
      ]}
    />
  );
};

export default PipelineDetailsPage;
