import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { connect } from 'react-redux';
import * as plugins from '@console/internal/plugins';
import { getResourceList } from '@console/shared';
import { TopologyDataModel, TopologyDataResources } from './topology-types';
import { transformTopologyData } from './topology-utils';

export interface RenderProps {
  data?: TopologyDataModel;
  loaded: boolean;
  loadError: any;
}

export interface ControllerProps {
  utils: Function[];
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
  resourceList: plugins.OverviewCRD[];
}

const allowedResources = ['deployments', 'deploymentConfigs', 'daemonSets', 'statefulSets'];

const Controller: React.FC<ControllerProps> = React.memo(
  ({ render, application, cheURL, resources, loaded, loadError, utils }) =>
    render({
      loaded,
      loadError,
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
}) => {
  const { resources, utils } = getResourceList(namespace, resourceList);
  return (
    <Firehose resources={resources} forceUpdate>
      <Controller application={application} cheURL={cheURL} render={render} utils={utils} />
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
