import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { TaskRunModel } from '../../../models';
import TaskRunsHeader from './TaskRunsHeader';
import TaskRunsRow from './TaskRunsRow';

const TaskRunsList: React.FC = (props) => (
  <Table
    {...props}
    aria-label={TaskRunModel.labelPlural}
    Header={TaskRunsHeader}
    Row={TaskRunsRow}
    virtualize
  />
);

export default TaskRunsList;
