import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { PipelineResourceModel } from '../../../models';
import PipelineResourcesHeader from './PipelineResourcesHeader';
import PipelineResourcesRow from './PipelineResourcesRow';

const PipelineResourcesList: React.FC = (props) => (
  <Table
    {...props}
    aria-label={PipelineResourceModel.labelPlural}
    Header={PipelineResourcesHeader}
    Row={PipelineResourcesRow}
    virtualize
  />
);

export default PipelineResourcesList;
