import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { pipelineFilterReducer, pipelineStatusFilter } from '../../utils/pipeline-filter-reducer';
import { PipelineModel } from '../../models';
import DefaultPage from '../DefaultPage';
import PipelineList from './PipelineList';

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

const PipelinesPage: React.FC<any> = (props) => {
  return props.namespace ? (
    <ListPage
      {...props}
      canCreate={false}
      kind={PipelineModel.kind}
      ListComponent={PipelineList}
      rowFilters={filters}
    />
  ) : (
    <DefaultPage title="Pipelines">Select a project to view the list of pipelines</DefaultPage>
  );
};

export default PipelinesPage;
