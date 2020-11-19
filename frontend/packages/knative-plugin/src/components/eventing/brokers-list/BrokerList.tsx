import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import BrokerHeaders from './BrokerHeaders';
import BrokerRow from './BrokerRow';

const BrokerList: React.FC<TableProps> = (props) => {
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
