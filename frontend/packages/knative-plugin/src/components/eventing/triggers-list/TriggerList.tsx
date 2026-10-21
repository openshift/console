import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import getTriggerHeaders from './TriggerHeaders';
import TriggerRow from './TriggerRow';

const TriggerList: FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const triggerData = props.customData?.broker
    ? props.data.filter((obj) => obj.spec.broker === props.customData.broker)
    : props.data;

  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Triggers')}
      data={triggerData}
      Header={getTriggerHeaders(t, !props.customData?.broker)}
      Row={TriggerRow}
      virtualize
    />
  );
};

export default TriggerList;
