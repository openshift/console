import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { history, Firehose, FirehoseResource, HintBlock } from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin';
import ODCEmptyState from './EmptyState';
import NamespacedPage from './NamespacedPage';
import ProjectsExistWrapper from './ProjectsExistWrapper';
import CreateProjectListPage from './projects/CreateProjectListPage';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

interface ResourcesType {
  deploymentConfigs?: K8sResourceKind;
  deployments?: K8sResourceKind;
  daemonSets?: K8sResourceKind;
  statefulSets?: K8sResourceKind;
  knativeService?: K8sResourceKind;
}
interface EmptyStateLoaderProps {
  resources?: ResourcesType;
  loaded?: boolean;
  loadError?: string;
}

const handleProjectCreate = (project: K8sResourceKind) =>
  history.push(`/add/ns/${project.metadata.name}`);

const EmptyStateLoader: React.FC<EmptyStateLoaderProps> = ({ resources, loaded, loadError }) => {
  const [noWorkloads, setNoWorkloads] = React.useState(false);
  const daemonSets = resources?.daemonSets?.data;
  const deploymentConfigs = resources?.deploymentConfigs?.data;
  const deployments = resources?.deployments?.data;
  const statefulSets = resources?.statefulSets?.data;
  const knativeService = resources?.knativeService?.data;

  React.useEffect(() => {
    if (loaded) {
      setNoWorkloads(
        _.isEmpty(daemonSets) &&
          _.isEmpty(deploymentConfigs) &&
          _.isEmpty(deployments) &&
          _.isEmpty(statefulSets) &&
          _.isEmpty(knativeService),
      );
    } else if (loadError) {
      setNoWorkloads(false);
    }
  }, [loaded, loadError, daemonSets, deploymentConfigs, deployments, statefulSets, knativeService]);
  return noWorkloads ? (
    <ODCEmptyState
      title="Add"
      hintBlock={
        <HintBlock title="No workloads found">
          <p>
            To add content to your project, create an application, component or service using one of
            these options.
          </p>
        </HintBlock>
      }
    />
  ) : (
    <ODCEmptyState title="Add" />
  );
};

const RenderEmptyState = ({ namespace }) => {
  const resources: FirehoseResource[] = [
    {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
      limit: 1,
    },
    {
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
      limit: 1,
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
      limit: 1,
    },
    {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
      limit: 1,
    },
    {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      prop: 'knativeService',
      optional: true,
      limit: 1,
    },
  ];
  return (
    <Firehose resources={resources}>
      <EmptyStateLoader />
    </Firehose>
  );
};

const AddPage: React.FC<AddPageProps> = ({ match }) => {
  const namespace = match.params.ns;

  return (
    <>
      <Helmet>
        <title>+Add</title>
      </Helmet>
      <NamespacedPage>
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <ProjectsExistWrapper title="Add">
            {namespace ? (
              <RenderEmptyState namespace={namespace} />
            ) : (
              <CreateProjectListPage onCreate={handleProjectCreate} title="Add" />
            )}
          </ProjectsExistWrapper>
        </Firehose>
      </NamespacedPage>
    </>
  );
};

export default AddPage;
