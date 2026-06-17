import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import ServiceHeader from './ServiceHeader';
import ServiceRow from './ServiceRow';

const ServiceList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <Table
      {...props}
      aria-label={t('Services')}
      Header={ServiceHeader(t)}
      Row={ServiceRow}
      virtualize
    />
  );
};

export default ServiceList;
