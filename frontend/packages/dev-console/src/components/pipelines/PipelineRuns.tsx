import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import PipelineRunsList from '../pipelineruns/PipelineRunList';
import {
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
} from '../../utils/pipeline-filter-reducer';
import { PipelineRunModel } from '../../models';

const filters = [
  {
    type: 'pipelinerun-status',
    selected: ['Succeeded'],
    reducer: pipelineRunFilterReducer,
    items: [
      { id: 'Succeeded', title: 'Complete' },
      { id: 'Failed', title: 'Failed' },
      { id: 'Running', title: 'Running' },
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
    kind={PipelineRunModel.kind}
    namespace={obj.metadata.namespace}
    selector={{
      'tekton.dev/pipeline': obj.metadata.name,
    }}
    ListComponent={PipelineRunsList}
    rowFilters={filters}
  />
);

export default PipelineRuns;
