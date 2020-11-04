import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import ServiceHeader from './ServiceHeader';
import ServiceRow from './ServiceRow';

const ServiceList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Services')}
      Header={ServiceHeader(t)}
      Row={ServiceRow}
      virtualize
    />
  );
};

export default ServiceList;
