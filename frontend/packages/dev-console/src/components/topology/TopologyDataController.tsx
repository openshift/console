import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { connect } from 'react-redux';
import * as plugins from '@console/internal/plugins';
import { getResourceList } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { RootState } from '@console/internal/redux';
import { ServiceBindingRequestModel } from '../../models';
import { TopologyFilters, getTopologyFilters } from './filters/filter-utils';
import { allowedResources, transformTopologyData } from './topology-utils';
import { TopologyDataModel, TopologyDataResources } from './topology-types';

export interface RenderProps {
  data?: TopologyDataModel;
  loaded: boolean;
  loadError: any;
  serviceBinding: boolean;
}

interface StateProps {
  resourceList: plugins.OverviewCRD[];
  filters: TopologyFilters;
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
  topologyFilters: TopologyFilters;
}

export interface TopologyDataControllerProps extends StateProps {
  namespace: string;
  render(RenderProps): React.ReactElement;
  application: string;
  knative: boolean;
  cheURL: string;
  serviceBinding: boolean;
}

const Controller: React.FC<ControllerProps> = ({
  render,
  application,
  cheURL,
  resources,
  loaded,
  loadError,
  utils,
  serviceBinding,
  topologyFilters,
}) =>
  render({
    loaded,
    loadError,
    serviceBinding,
    data: loaded
      ? transformTopologyData(
          resources,
          allowedResources,
          application,
          cheURL,
          utils,
          topologyFilters,
        )
      : null,
  });

export const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  namespace,
  render,
  application,
  cheURL,
  resourceList,
  serviceBinding,
  filters,
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
        topologyFilters={filters}
      />
    </Firehose>
  );
};

const DataControllerStateToProps = (state: RootState) => {
  const resourceList = plugins.registry
    .getOverviewCRDs()
    .filter((resource) => state.FLAGS.get(resource.properties.required));
  const filters = getTopologyFilters(state);
  return { resourceList, filters };
};

export default connect(DataControllerStateToProps)(TopologyDataController);
