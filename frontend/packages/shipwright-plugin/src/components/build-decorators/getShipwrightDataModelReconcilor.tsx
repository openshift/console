import { Model } from '@patternfly/react-topology';
import { TopologyDataResources } from '@console/topology/src/topology-types';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import { BUILDRUN_TO_RESOURCE_MAP_LABEL } from '../../const';

export const getShipwrightDataModelReconcilor = (
  model: Model,
  resources: TopologyDataResources,
): void => {
  if (!model || !model.nodes) {
    return;
  }

  model.nodes.forEach((node) => {
    const resource = getTopologyResourceObject(node.data);

    const resourcePartOf = resource?.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL];
    if (!resourcePartOf) {
      return;
    }

    /* Fixing the issue occuring during Knative Service creation */
    if (!node.data.resources) {
      node.data.resources = {};
    }

    if (
      resources?.builds?.data.find(
        (build) => build.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] === resourcePartOf,
      )
    ) {
      node.data.resources.builds = resources?.builds?.data;
      node.data.resources.buildRuns = resources?.buildRuns?.data;
    }
  });
};
