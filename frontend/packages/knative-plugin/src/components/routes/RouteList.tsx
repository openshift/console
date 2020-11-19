import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import RouteHeader from './RouteHeader';
import RouteRow from './RouteRow';

const RouteList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Routes')}
      Header={RouteHeader(t)}
      Row={RouteRow}
      virtualize
    />
  );
};

export default RouteList;
