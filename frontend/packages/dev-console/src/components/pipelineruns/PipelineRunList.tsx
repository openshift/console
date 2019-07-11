import * as React from 'react';
import { VirtualTable } from '@console/internal/components/factory';
import PipelineRunHeader from './PipelineRunHeader';
import PipelineRunRow from './PipelineRunRow';
import { PipelineRunModel } from '../../models';

export const PipelineRunList: React.FC = (props) => (
  <VirtualTable
    {...props}
    aria-label={PipelineRunModel.labelPlural}
    Header={PipelineRunHeader}
    Row={PipelineRunRow}
  />
);

export default PipelineRunList;
