import * as React from 'react';
import { inject } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { augmentRunsToData, PropPipelineData, KeyedRuns } from '../../utils/pipeline-augment';
import { pipelineFilterReducer, pipelineStatusFilter } from '../../utils/pipeline-filter-reducer';

interface ListPipelineData extends K8sKind {
  data: PropPipelineData[];
}
export const filters = [
  {
    type: 'pipeline-status',
    selected: ['Running', 'Failed', 'Succeeded'],
    reducer: pipelineFilterReducer,
    items: [
      { id: 'Running', title: 'Running' },
      { id: 'Failed', title: 'Failed' },
      { id: 'Succeeded', title: 'Succeeded' },
    ],
    filter: pipelineStatusFilter,
  },
];

export type PipelineAugmentRunsProps = {
  data?: PropPipelineData[];
  propsReferenceForRuns?: string[];
  pipeline?: ListPipelineData;
  reduxIDs?: string[];
  applyFilter?: () => void;
  filters?: Record<string, any>[];
};
// Firehose injects a lot of props and some of those are considered the KeyedRuns
const PipelineAugmentRuns: React.FC<PipelineAugmentRunsProps> = ({
  pipeline,
  propsReferenceForRuns,
  ...props
}) => {
  const paramFilters = {};
  const params = new URLSearchParams(window.location.search);
  params.forEach((v, k) => {
    paramFilters[k] = v;
  });

  const resourceData =
    pipeline && pipeline.data && propsReferenceForRuns
      ? augmentRunsToData(pipeline.data, propsReferenceForRuns, props as KeyedRuns)
      : null;

  const children = inject(props.children, {
    resources: { pipeline: { data: resourceData } },
    reduxIDs: props.reduxIDs,
    applyFilter: props.applyFilter,
    loaded: true,
    filters: { ...props.filters, ...paramFilters },
  });
  return <>{children}</>;
};

export default PipelineAugmentRuns;
