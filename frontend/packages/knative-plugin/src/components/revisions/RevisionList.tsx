import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory/table';
import type { RevisionKind } from '../../types';
import { useRevisionColumns } from './RevisionHeader';
import { getRevisionDataViewRows } from './RevisionRow';

export const RevisionList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns, resetAllColumnWidths } = useRevisionColumns();
  return (
    <ConsoleDataView<RevisionKind>
      {...props}
      label={t('Revisions')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getRevisionDataViewRows}
      hideColumnManagement
      isResizable
      resetAllColumnWidths={resetAllColumnWidths}
    />
  );
};
