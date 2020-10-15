import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import getTriggerHeaders from './TriggerHeaders';
import TriggerRow from './TriggerRow';

const TriggerList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Triggers')}
      Header={getTriggerHeaders(t, !props.customData?.broker)}
      Row={TriggerRow}
      virtualize
    />
  );
};

export default TriggerList;
