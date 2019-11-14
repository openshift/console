import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { Table } from '@console/internal/components/factory';
import { PropPipelineData } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import PipelineHeader from './PipelineHeader';
import PipelineRow from './PipelineRow';

export interface PipelineListProps {
  data?: PropPipelineData[];
}

const PipelineList: React.FC<PipelineListProps> = (props) => {
  return (
    <Table
      {...props}
      defaultSortField="latestRun.status.completionTime"
      defaultSortOrder={SortByDirection.desc}
      aria-label={PipelineModel.labelPlural}
      Header={PipelineHeader}
      Row={PipelineRow}
      virtualize
    />
  );
};

export default PipelineList;
