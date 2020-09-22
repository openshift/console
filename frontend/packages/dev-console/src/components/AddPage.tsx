import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { Firehose, FirehoseResource, HintBlock } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { TopologyDataResources } from '@console/dev-console/src/components/topology';
import { EventingBrokerModel } from '@console/knative-plugin/src/models';
import {
  getDynamicChannelResourceList,
  getDynamicEventSourcesResourceList,
  getDynamicChannelModelRefs,
  getDynamicEventSourcesModelRefs,
} from '@console/knative-plugin/src/utils/fetch-dynamic-eventsources-utils';
import { getKnativeDynamicResources } from '@console/knative-plugin/src/topology/knative-topology-utils';
import {
  knativeEventingResourcesBroker,
  knativeServingResourcesServices,
} from '@console/knative-plugin/src/utils/get-knative-resources';
import ODCEmptyState from './EmptyState';
import NamespacedPage from './NamespacedPage';
import ProjectsExistWrapper from './ProjectsExistWrapper';
import CreateProjectListPage from './projects/CreateProjectListPage';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

interface EmptyStateLoaderProps {
  resources?: TopologyDataResources;
  loaded?: boolean;
  loadError?: string;
}

const EmptyStateLoader: React.FC<EmptyStateLoaderProps> = ({ resources, loaded, loadError }) => {
  const [noWorkloads, setNoWorkloads] = React.useState(false);
  const daemonSets = resources?.daemonSets?.data;
  const deploymentConfigs = resources?.deploymentConfigs?.data;
  const deployments = resources?.deployments?.data;
  const statefulSets = resources?.statefulSets?.data;
  const knativeServices = resources?.ksservices?.data;
  const knDynamicResources: K8sResourceKind[] = getKnativeDynamicResources(resources, [
    ...getDynamicChannelModelRefs(),
    ...getDynamicEventSourcesModelRefs(),
    EventingBrokerModel.plural,
  ]);

  React.useEffect(() => {
    if (loaded) {
      setNoWorkloads(
        _.isEmpty(daemonSets) &&
          _.isEmpty(deploymentConfigs) &&
          _.isEmpty(deployments) &&
          _.isEmpty(statefulSets) &&
          _.isEmpty(knativeServices) &&
          _.isEmpty(knDynamicResources),
      );
    } else if (loadError) {
      setNoWorkloads(false);
    }
  }, [
    loaded,
    loadError,
    daemonSets,
    deploymentConfigs,
    deployments,
    statefulSets,
    knativeServices,
    knDynamicResources,
  ]);
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
    ...knativeServingResourcesServices(namespace, 1),
    ...knativeEventingResourcesBroker(namespace, 1),
    ...getDynamicChannelResourceList(namespace, 1),
    ...getDynamicEventSourcesResourceList(namespace, 1),
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
              <CreateProjectListPage title="Add">
                Select a project to start adding to it
              </CreateProjectListPage>
            )}
          </ProjectsExistWrapper>
        </Firehose>
      </NamespacedPage>
    </>
  );
};

export default AddPage;
