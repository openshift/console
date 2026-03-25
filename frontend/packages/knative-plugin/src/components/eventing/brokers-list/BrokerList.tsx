import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import BrokerHeaders from './BrokerHeaders';
import BrokerRow from './BrokerRow';

const BrokerList: FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Brokers')}
      Header={BrokerHeaders(t)}
      Row={BrokerRow}
      virtualize
    />
  );
};

export default BrokerList;
