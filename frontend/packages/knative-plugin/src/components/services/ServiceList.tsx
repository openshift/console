import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory/table';
import type { ServiceKind } from '../../types';
import { useKnativeDataViewFilters } from '../useKnativeDataViewFilters';
import { getServiceDataViewRows } from './ServiceRow';
import { useServiceColumns } from './useServiceColumns';

export const ServiceList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns, resetAllColumnWidths } = useServiceColumns();
  const dataViewFilters = useKnativeDataViewFilters<ServiceKind>(props.rowFilters);
  return (
    <ConsoleDataView<ServiceKind>
      {...props}
      {...dataViewFilters}
      label={t('Services')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getServiceDataViewRows}
      hideColumnManagement
      isResizable
      resetAllColumnWidths={resetAllColumnWidths}
    />
  );
};
