import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { TaskRunModel } from '../../../models';
import TaskRunsHeader from './TaskRunsHeader';
import TaskRunsRow from './TaskRunsRow';

interface TaskRunsListProps {
  customData?: { [key: string]: any };
}

const TaskRunsList: React.FC<TaskRunsListProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t(TaskRunModel.labelPluralKey)}
      defaultSortField="status.startTime"
      defaultSortOrder={SortByDirection.desc}
      Header={TaskRunsHeader(props.customData?.showPipelineColumn)}
      Row={TaskRunsRow}
      virtualize
    />
  );
};

export default TaskRunsList;
