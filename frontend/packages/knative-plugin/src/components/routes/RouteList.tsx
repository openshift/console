import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { RouteModel } from '../../models';
import type { RouteKind } from '../../types';
import { useRouteColumns } from './RouteHeader';
import { getRouteDataViewRows } from './RouteRow';

type RouteListProps = Omit<ConsoleDataViewProps<RouteKind>, 'id' | 'columns' | 'getDataViewRows'>;

export const RouteList: FC<RouteListProps> = (props) => {
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
