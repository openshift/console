import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import EventSourceHeaders from './EventSourceHeaders';
import EventSourceRow from './EventSourceRow';

const EventSourceList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Event Sources')}
      Header={EventSourceHeaders(t)}
      Row={EventSourceRow}
      virtualize
    />
  );
};

export default EventSourceList;
