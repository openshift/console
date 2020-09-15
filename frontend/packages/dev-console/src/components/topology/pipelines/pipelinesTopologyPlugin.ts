import { Plugin } from '@console/plugin-sdk';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { TopologyDataModelFactory } from '../../../extensions/topology';
import { tknPipelineAndPipelineRunsWatchResources } from '../../../utils/pipeline-plugin-utils';
import { FLAG_OPENSHIFT_PIPELINE } from '../../../const';

export type PipelineTopologyConsumedExtensions = TopologyDataModelFactory;

const getPipelineWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return tknPipelineAndPipelineRunsWatchResources(namespace);
};

export const pipelinesTopologyPlugin: Plugin<PipelineTopologyConsumedExtensions> = [
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'pipeline-topology-model-factory',
      priority: 800,
      resources: getPipelineWatchedResources,
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
    },
  },
];
