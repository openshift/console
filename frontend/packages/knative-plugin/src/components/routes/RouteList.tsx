import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory/table';
import { RouteModel } from '../../models';
import type { RouteKind } from '../../types';
import { useRouteColumns } from './RouteHeader';
import { getRouteDataViewRows } from './RouteRow';

export const RouteList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns } = useRouteColumns();
  return (
    <ConsoleDataView<RouteKind>
      {...props}
      id={RouteModel}
      label={t('Routes')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getRouteDataViewRows}
    />
  );
};
