import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { Plugin } from '@console/plugin-sdk';
import {
  TopologyDecoratorProvider,
  TopologyDataModelFactory,
} from '@console/topology/src/extensions/topology';
import { TopologyDecoratorQuadrant } from '@console/topology/src/topology-types';
import { FLAG_OPENSHIFT_PIPELINE } from '../const';
import { tknPipelineAndPipelineRunsWatchResources } from '../utils/pipeline-plugin-utils';
import { getPipelineRunDecorator } from './build-decorators';
import { getDataModelReconciler } from './index';

export type PipelineTopologyConsumedExtensions =
  | TopologyDecoratorProvider
  | TopologyDataModelFactory;

export const pipelinesTopologyPlugin: Plugin<PipelineTopologyConsumedExtensions> = [
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'pipeline-topology-model-factory',
      priority: 800,
      resources: tknPipelineAndPipelineRunsWatchResources,
      getDataModelReconciler,
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'pipeline-run-decorator',
      priority: 100,
      quadrant: TopologyDecoratorQuadrant.lowerLeft,
      decorator: applyCodeRefSymbol(getPipelineRunDecorator),
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
    },
  },
];
