import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { SortByDirection } from '@patternfly/react-table';
import { TaskRunModel } from '../../../models';
import TaskRunsHeader from './TaskRunsHeader';
import TaskRunsRow from './TaskRunsRow';

interface TaskRunsListProps {
  customData?: { [key: string]: any };
}

const TaskRunsList: React.FC<TaskRunsListProps> = (props) => (
  <Table
    {...props}
    aria-label={TaskRunModel.labelPlural}
    defaultSortField="status.startTime"
    defaultSortOrder={SortByDirection.desc}
    Header={TaskRunsHeader(props.customData?.showPipelineColumn)}
    Row={TaskRunsRow}
    virtualize
  />
);

export default TaskRunsList;
