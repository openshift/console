import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import EventSourceHeaders from './EventSourceHeaders';
import EventSourceRow from './EventSourceRow';

const EventSourceList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <Table
      {...props}
      aria-label={t('Event Sources')}
      Header={EventSourceHeaders(t)}
      Row={EventSourceRow}
      virtualize
    />
  );
};

export default EventSourceList;
