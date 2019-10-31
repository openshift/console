import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { connect } from 'react-redux';
import * as plugins from '@console/internal/plugins';
import { getResourceList } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { ServiceBindingRequestModel } from '../../models';
import { TopologyDataModel, TopologyDataResources } from './topology-types';
import { transformTopologyData } from './topology-utils';

export interface RenderProps {
  data?: TopologyDataModel;
  loaded: boolean;
  loadError: any;
  serviceBinding: boolean;
}

export interface ControllerProps {
  utils: Function[];
  loaded?: boolean;
  loadError?: any;
  resources?: TopologyDataResources;
  render(RenderProps): React.ReactElement;
  application: string;
  cheURL: string;
  serviceBinding: boolean;
}

export interface TopologyDataControllerProps {
  namespace: string;
  render(RenderProps): React.ReactElement;
  application: string;
  knative: boolean;
  cheURL: string;
  serviceBinding: boolean;
  resourceList: plugins.OverviewCRD[];
}

const allowedResources = ['deployments', 'deploymentConfigs', 'daemonSets', 'statefulSets'];

const Controller: React.FC<ControllerProps> = React.memo(
  ({ render, application, cheURL, resources, loaded, loadError, utils, serviceBinding }) =>
    render({
      loaded,
      loadError,
      serviceBinding,
      data: loaded
        ? transformTopologyData(resources, allowedResources, application, cheURL, utils)
        : null,
    }),
);

export const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  namespace,
  render,
  application,
  cheURL,
  resourceList,
  serviceBinding,
}) => {
  const { resources, utils } = getResourceList(namespace, resourceList);
  if (serviceBinding) {
    resources.push(
      {
        isList: true,
        kind: referenceForModel(ClusterServiceVersionModel),
        namespace,
        prop: 'clusterServiceVersion',
        optional: true,
      },
      {
        isList: true,
        kind: referenceForModel(ServiceBindingRequestModel),
        namespace,
        prop: 'serviceBindingRequests',
        optional: true,
      },
    );
  }
  return (
    <Firehose resources={resources}>
      <Controller
        application={application}
        cheURL={cheURL}
        render={render}
        utils={utils}
        serviceBinding={serviceBinding}
      />
    </Firehose>
  );
};

const DataControllerStateToProps = ({ FLAGS }) => {
  const resourceList = plugins.registry
    .getOverviewCRDs()
    .filter((resource) => FLAGS.get(resource.properties.required));
  return { resourceList };
};

export default connect(DataControllerStateToProps)(TopologyDataController);
