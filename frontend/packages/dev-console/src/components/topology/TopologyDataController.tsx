import * as React from 'react';
import { Firehose, FirehoseResource, checkAccess } from '@console/internal/components/utils';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { knativeServingResources, ServiceModel } from '@console/knative-plugin';
import { TopologyDataModel, TopologyDataResources } from './topology-types';
import { TransformTopologyData } from './topology-utils';

export interface RenderProps {
  data?: TopologyDataModel;
  loaded: boolean;
  loadError: any;
}

export interface ControllerProps {
  loaded?: boolean;
  loadError?: any;
  resources?: TopologyDataResources;
  render(RenderProps): React.ReactElement;
  application: string;
  cheURL: string;
}

export interface TopologyDataControllerProps {
  namespace: string;
  render(RenderProps): React.ReactElement;
  application: string;
  knative: boolean;
  cheURL: string;
}

const Controller: React.FC<ControllerProps> = React.memo(
  ({ render, application, cheURL, resources, loaded, loadError }) =>
    render({
      loaded,
      loadError,
      data: loaded
        ? new TransformTopologyData(resources, application, cheURL)
            .transformDataBy('deployments')
            .transformDataBy('deploymentConfigs')
            .transformDataBy('daemonSets')
            .transformDataBy('statefulSets')
            .getTopologyData()
        : null,
    }),
);

const getResourceList = (namespace: string) => {
  const resourcesList: FirehoseResource[] = [
    {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
    },
    {
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
    },
    {
      isList: true,
      kind: 'Pod',
      namespace,
      prop: 'pods',
    },
    {
      isList: true,
      kind: 'ReplicationController',
      namespace,
      prop: 'replicationControllers',
    },
    {
      isList: true,
      kind: 'Route',
      namespace,
      prop: 'routes',
    },
    {
      isList: true,
      kind: 'Service',
      namespace,
      prop: 'services',
    },
    {
      isList: true,
      kind: 'ReplicaSet',
      namespace,
      prop: 'replicasets',
    },
    {
      isList: true,
      kind: 'BuildConfig',
      namespace,
      prop: 'buildconfigs',
    },
    {
      isList: true,
      kind: 'Build',
      namespace,
      prop: 'builds',
    },
    {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
    },
  ];
  return resourcesList;
};

const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  namespace,
  render,
  application,
  knative,
  cheURL,
}) => {
  const [resources, setResourcesItems] = React.useState(getResourceList(namespace));
  React.useEffect(() => {
    const checkKnAccess = async () => {
      const resourceList = getResourceList(namespace);
      if (knative) {
        const resourceAttributes: AccessReviewResourceAttributes = {
          group: ServiceModel.apiGroup,
          resource: ServiceModel.plural,
          verb: 'get',
          namespace,
        };
        const knativeResource = knativeServingResources(namespace);
        await checkAccess(resourceAttributes).then((resp) => {
          if (resp && resp.status && resp.status.allowed) {
            setResourcesItems([...resourceList, ...knativeResource]);
          } else {
            setResourcesItems(resourceList);
          }
        });
      } else {
        setResourcesItems(resourceList);
      }
    };
    checkKnAccess();
  }, [namespace, knative]);

  return (
    <Firehose resources={resources} forceUpdate>
      <Controller application={application} cheURL={cheURL} render={render} />
    </Firehose>
  );
};

export default React.memo(TopologyDataController);
