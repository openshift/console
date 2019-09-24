import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import PipelineRunsList from '../pipelineruns/PipelineRunList';
import {
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
} from '../../utils/pipeline-filter-reducer';
import { ListFilterId, ListFilterLabels } from '../../utils/pipeline-utils';
import { PipelineRunModel } from '../../models';

export const runFilters = [
  {
    type: 'pipelinerun-status',
    selected: [ListFilterId.Succeeded, ListFilterId.Running, ListFilterId.Failed],
    reducer: pipelineRunFilterReducer,
    items: [
      { id: ListFilterId.Succeeded, title: ListFilterLabels[ListFilterId.Succeeded] },
      { id: ListFilterId.Running, title: ListFilterLabels[ListFilterId.Running] },
      { id: ListFilterId.Failed, title: ListFilterLabels[ListFilterId.Failed] },
    ],
    filter: pipelineRunStatusFilter,
  },
];

interface PipelineRunsProps {
  obj: any;
}

const PipelineRuns: React.FC<PipelineRunsProps> = ({ obj }) => (
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
