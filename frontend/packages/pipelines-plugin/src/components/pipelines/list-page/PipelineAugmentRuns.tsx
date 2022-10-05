import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { inject } from '@console/internal/components/utils';
import { FirehoseResult } from '@console/internal/module/k8s';
import { PipelineRunKind } from '../../../types';
import { augmentRunsToData, PropPipelineData } from '../../../utils/pipeline-augment';
import {
  pipelineFilterReducer,
  pipelineStatusFilter,
} from '../../../utils/pipeline-filter-reducer';
import { ListFilterId, ListFilterLabels } from '../../../utils/pipeline-utils';

export const filters = (t: TFunction): RowFilter[] => {
  return [
    {
      filterGroupName: t('pipelines-plugin~Status'),
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
};

export type PipelineAugmentRunsProps = {
  data?: PropPipelineData[];
  pipeline?: FirehoseResult<PropPipelineData[]>;
  pipelinerun?: FirehoseResult<PipelineRunKind[]>;
  reduxIDs?: string[];
  applyFilter?: () => void;
  filters?: Record<string, any>[];
};
// Firehose injects a lot of props and some of those are considered the KeyedRuns
const PipelineAugmentRuns: React.FC<PipelineAugmentRunsProps> = ({ ...props }) => {
  const allFilters = {
    ...props.filters,
    ...(_.get(props.pipeline, 'filters.name') && { name: _.get(props.pipeline, 'filters.name') }),
  };
  const resourceData =
    props.pipeline?.data && props.pipelinerun?.data
      ? augmentRunsToData(props.pipeline.data, props.pipelinerun.data)
      : null;

  const children = inject(props.children, {
    ...props,
    filters: allFilters,
    resources: { pipeline: { data: resourceData } },
  });
  return <>{children}</>;
};

export default PipelineAugmentRuns;
