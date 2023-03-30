import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { ColumnLayout } from '@console/dynamic-plugin-sdk';
import { Table } from '@console/internal/components/factory';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import { TaskRunModel } from '../../../models';
import TaskRunsHeader from './TaskRunsHeader';
import TaskRunsRow from './TaskRunsRow';

interface TaskRunsListProps {
  customData?: { [key: string]: any };
  columnLayout: ColumnLayout;
}

const TaskRunsList: React.FC<TaskRunsListProps> = (props) => {
  const { t } = useTranslation();
  const {
    columnLayout: { columns, id },
    customData,
  } = props;
  const [activeColumns, userSettingsLoaded] = useActiveColumns({
    columns,
    columnManagementID: id,
  });
  const selectedColumns = React.useMemo(() => new Set(activeColumns.map((col) => col.id)), [
    activeColumns,
  ]);
  const newCustomData = { ...customData, selectedColumns };
  return (
    userSettingsLoaded && (
      <Table
        {...props}
        aria-label={t(TaskRunModel.labelPluralKey)}
        defaultSortField="status.startTime"
        defaultSortOrder={SortByDirection.desc}
        Header={TaskRunsHeader(props.customData?.showPipelineColumn)}
        Row={TaskRunsRow}
        virtualize
        activeColumns={selectedColumns}
        customData={newCustomData}
      />
    )
  );
};

export default TaskRunsList;
