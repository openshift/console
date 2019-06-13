import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import PipelineList from './PipelineList';
import { pipelineFilterReducer, pipelineStatusFilter } from '../../utils/pipeline-filter-reducer';
import { PipelineModel } from '../../models';

const filters = [
  {
    type: 'pipeline-status',
    selected: ['Running', 'Failed', 'Complete'],
    reducer: pipelineFilterReducer,
    items: [
      { id: 'Running', title: 'Running' },
      { id: 'Failed', title: 'Failed' },
      { id: 'Complete', title: 'Complete' },
    ],
    filter: pipelineStatusFilter,
  },
];

const PipelinesPage: React.FC<any> = (props) => (
  <ListPage
    {...props}
    canCreate={false}
    kind={PipelineModel.kind}
    ListComponent={PipelineList}
    rowFilters={filters}
  />
);

export default PipelinesPage;
