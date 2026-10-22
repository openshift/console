import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { RowFilter } from '@console/internal/components/filter-toolbar';
import { ServiceModel } from '../../models';
import type { ServiceKind } from '../../types';
import { useKnativeDataViewFilters } from '../useKnativeDataViewFilters';
import { getServiceDataViewRows } from './ServiceRow';
import { useServiceColumns } from './useServiceColumns';

type ServiceListProps = Omit<
  ConsoleDataViewProps<ServiceKind>,
  'id' | 'columns' | 'getDataViewRows'
> & { rowFilters?: RowFilter[] };

export const ServiceList: FC<ServiceListProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns } = useServiceColumns();
  const dataViewFilters = useKnativeDataViewFilters<ServiceKind>(props.rowFilters);
  return (
    <ConsoleDataView<ServiceKind>
      {...props}
      {...dataViewFilters}
      id={ServiceModel}
      label={t('Services')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getServiceDataViewRows}
    />
  );
};
