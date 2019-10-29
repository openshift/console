import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
<<<<<<< HEAD
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { rerunPipeline, stopPipelineRun } from '../../utils/pipeline-actions';
import { PipelineRunDetails } from './PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './PipelineRunLogs';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={[rerunPipeline, stopPipelineRun, Kebab.factory.Delete]}
    getResourceStatus={pipelineRunStatus}
    pages={[
      navFactory.details(PipelineRunDetails),
      navFactory.editYaml(),
      {
        href: 'logs',
        path: 'logs/:name?',
        name: 'Logs',
        component: PipelineRunLogsWithActiveTask,
      },
    ]}
  />
);
=======
import { k8sGet } from '@console/internal/module/k8s';
import { ErrorPage404 } from '@console/internal/components/error';
import { PipelineRunModel } from '../../models';
import {
  rerunPipeline,
  stopPipelineRun,
  handlePipelineRunSubmit,
} from '../../utils/pipeline-actions';
import { PipelineRunDetails } from './PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './PipelineRunLogs';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const [plrInstance, setPlrInstance] = React.useState({ ref: null, status: null });

  React.useEffect(() => {
    k8sGet(PipelineRunModel, props.name, props.namespace)
      .then((res) => {
        setPlrInstance({ ref: res, status: 200 });
      })
      .catch((error) => setPlrInstance({ ref: null, status: error.response.status }));
  }, [props.name, props.namespace]);

  if (plrInstance.status === 404) {
    return <ErrorPage404 />;
  }
  return (
    <DetailsPage
      {...props}
      menuActions={[
        ...(plrInstance && plrInstance.ref
          ? [() => rerunPipeline(PipelineRunModel, null, plrInstance.ref, handlePipelineRunSubmit)]
          : []),
        stopPipelineRun,
        Kebab.factory.Delete,
      ]}
      pages={[
        navFactory.details(PipelineRunDetails),
        navFactory.editYaml(),
        {
          href: 'logs',
          path: 'logs/:name?',
          name: 'Logs',
          component: PipelineRunLogsWithActiveTask,
        },
      ]}
    />
  );
};
>>>>>>> 727c9160ffb39b1b9a2f60fe974a81eeb4680fdd
export default PipelineRunDetailsPage;
