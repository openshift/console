import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import RouteHeader from './RouteHeader';
import RouteRow from './RouteRow';

const RouteList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <Table {...props} aria-label={t('Routes')} Header={RouteHeader(t)} Row={RouteRow} virtualize />
  );
};

export default RouteList;
