import * as React from 'react';
import * as _ from 'lodash';
import { inject } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { augmentRunsToData, PropPipelineData, KeyedRuns } from '../../../utils/pipeline-augment';
import { ListFilterId, ListFilterLabels } from '../../../utils/pipeline-utils';
import {
  pipelineFilterReducer,
  pipelineStatusFilter,
} from '../../../utils/pipeline-filter-reducer';

interface ListPipelineData extends K8sKind {
  data: PropPipelineData[];
}
export const filters = [
  {
    filterGroupName: 'Status',
    type: 'pipeline-status',
    reducer: pipelineFilterReducer,
    items: [
      { id: ListFilterId.Succeeded, title: ListFilterLabels[ListFilterId.Succeeded] },
      { id: ListFilterId.Running, title: ListFilterLabels[ListFilterId.Running] },
      { id: ListFilterId.Failed, title: ListFilterLabels[ListFilterId.Failed] },
      { id: ListFilterId.Cancelled, title: ListFilterLabels[ListFilterId.Cancelled] },
      { id: ListFilterId.Other, title: ListFilterLabels[ListFilterId.Other] },
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
  const allFilters = {
    ...props.filters,
    ...(_.get(props.pipeline, 'filters.name') && { name: _.get(props.pipeline, 'filters.name') }),
  };
  const resourceData =
    props.pipeline && props.pipeline.data && propsReferenceForRuns
      ? augmentRunsToData(props.pipeline.data, propsReferenceForRuns, props as KeyedRuns)
      : null;

  const children = inject(props.children, {
    ...props,
    filters: allFilters,
    resources: { pipeline: { data: resourceData } },
  });
  return <>{children}</>;
};

export default PipelineAugmentRuns;
