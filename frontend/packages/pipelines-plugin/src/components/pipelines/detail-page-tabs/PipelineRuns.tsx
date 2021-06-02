import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../models';
import {
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
} from '../../../utils/pipeline-filter-reducer';
import { ListFilterId, ListFilterLabels } from '../../../utils/pipeline-utils';
import PipelineRunsList from '../../pipelineruns/list-page/PipelineRunList';
import { PipelineDetailsTabProps } from './types';

export const runFilters = [
  {
    filterGroupName: 'Status',
    type: 'pipelinerun-status',
    selected: [
      ListFilterId.Succeeded,
      ListFilterId.Running,
      ListFilterId.Failed,
      ListFilterId.Cancelled,
    ],
    reducer: pipelineRunFilterReducer,
    items: [
      { id: ListFilterId.Succeeded, title: ListFilterLabels[ListFilterId.Succeeded] },
      { id: ListFilterId.Running, title: ListFilterLabels[ListFilterId.Running] },
      { id: ListFilterId.Failed, title: ListFilterLabels[ListFilterId.Failed] },
      { id: ListFilterId.Cancelled, title: ListFilterLabels[ListFilterId.Cancelled] },
    ],
    filter: pipelineRunStatusFilter,
  },
];

const PipelineRuns: React.FC<PipelineDetailsTabProps> = ({ obj }) => (
  <ListPage
    showTitle={false}
    canCreate={false}
    kind={referenceForModel(PipelineRunModel)}
    namespace={obj.metadata.namespace}
    selector={{
      'tekton.dev/pipeline': obj.metadata.name,
    }}
    ListComponent={PipelineRunsList}
    rowFilters={runFilters}
  />
);

export default PipelineRuns;
