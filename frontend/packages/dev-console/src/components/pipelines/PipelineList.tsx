import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import PipelineHeader from './PipelineHeader';
import PipelineRow from './PipelineRow';
import { PropPipelineData } from '../../utils/pipeline-augment';
import { PipelineModel } from '../../models';

export interface PipelineListProps {
  data?: PropPipelineData[];
}

const PipelineList: React.FC<any> = (props) => {
  return (
    <Table
      {...props}
      aria-label={PipelineModel.labelPlural}
      Header={PipelineHeader}
      Row={PipelineRow}
      virtualize
    />
  );
};

export default PipelineList;
