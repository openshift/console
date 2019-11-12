import * as React from 'react';
import { inject } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { augmentRunsToData, PropPipelineData, KeyedRuns } from '../../utils/pipeline-augment';
import { ListFilterId, ListFilterLabels } from '../../utils/pipeline-utils';
import { pipelineFilterReducer, pipelineStatusFilter } from '../../utils/pipeline-filter-reducer';

interface ListPipelineData extends K8sKind {
  data: PropPipelineData[];
  filters: {};
}
export const filters = [
  {
    type: 'pipeline-status',
    selected: [ListFilterId.Succeeded, ListFilterId.Running, ListFilterId.Failed],
    reducer: pipelineFilterReducer,
    items: [
      { id: ListFilterId.Succeeded, title: ListFilterLabels[ListFilterId.Succeeded] },
      { id: ListFilterId.Running, title: ListFilterLabels[ListFilterId.Running] },
      { id: ListFilterId.Failed, title: ListFilterLabels[ListFilterId.Failed] },
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
  propsReferenceForRuns,
  ...props
}) => {
  const resourceData =
    props.pipeline && props.pipeline.data && propsReferenceForRuns
      ? augmentRunsToData(props.pipeline.data, propsReferenceForRuns, props as KeyedRuns)
      : null;

  const children = inject(props.children, {
    ...props,
    filters: props.pipeline.filters,
    resources: { pipeline: { data: resourceData } },
  });
  return <>{children}</>;
};

export default PipelineAugmentRuns;
