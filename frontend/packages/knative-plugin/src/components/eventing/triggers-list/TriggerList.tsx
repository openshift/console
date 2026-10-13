import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { EventingTriggerModel } from '../../../models';
import type { EventTriggerKind } from '../../../types';
import { useTriggerColumns } from './TriggerHeaders';
import { getTriggerDataViewRows } from './TriggerRow';

type TriggerListProps = Omit<
  ConsoleDataViewProps<EventTriggerKind>,
  'id' | 'columns' | 'getDataViewRows'
> & { customData?: { broker?: string } };

export const TriggerList: FC<TriggerListProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const broker = props.customData?.broker;
  const data = useMemo(
    () =>
      broker
        ? props.data?.filter((obj: EventTriggerKind) => obj.spec.broker === broker)
        : props.data,
    [props.data, broker],
  );
  const { columns } = useTriggerColumns(!broker);
  return (
    <ConsoleDataView<EventTriggerKind>
      {...props}
      id={EventingTriggerModel}
      label={t('Triggers')}
      data={data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getTriggerDataViewRows}
    />
  );
};
