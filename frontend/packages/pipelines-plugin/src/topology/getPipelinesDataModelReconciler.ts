import { Model } from '@patternfly/react-topology';
import { TopologyDataResources } from '@console/topology/src/topology-types';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import { getPipelinesAndPipelineRunsForResource } from '../utils/pipeline-plugin-utils';

export const getPipelinesDataModelReconciler = (
  model: Model,
  resources: TopologyDataResources,
): void => {
  if (!model || !model.nodes) {
    return;
  }

  // For all nodes, associate any pipeline data with the node
  model.nodes.forEach((node) => {
    const resource = getTopologyResourceObject(node.data);
    if (resource) {
      const pipelineData = getPipelinesAndPipelineRunsForResource(resource, resources);
      if (pipelineData) {
        node.data.resources.pipelines = pipelineData.pipelines;
        node.data.resources.pipelineRuns = pipelineData.pipelineRuns;
      }
    }
  });
};
