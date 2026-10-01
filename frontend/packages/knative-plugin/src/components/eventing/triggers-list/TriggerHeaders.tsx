import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { EventTriggerKind } from '../../../types';

export const useTriggerColumns = (
  showBroker: boolean,
): { columns: ConsoleDataViewColumn<EventTriggerKind>[] } => {
  const { t } = useTranslation('knative-plugin');
  const columns = useMemo(
    () =>
      [
        {
          id: 'name',
          title: t('Name'),
          sort: 'metadata.name',
          props: getNameColumnProps(),
        },
        {
          id: 'namespace',
          title: t('Namespace'),
          sort: 'metadata.namespace',
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'ready',
          title: t('Ready'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'condition',
          title: t('Conditions'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'filters',
          title: t('Filters'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'broker',
          title: t('Broker'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'subscriber',
          title: t('Subscriber'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'created',
          title: t('Created'),
          sort: 'metadata.creationTimestamp',
          props: { modifier: 'nowrap' as const },
        },
        { id: 'actions', title: '', props: cellIsStickyProps },
      ].filter(({ id }) => id !== 'broker' || showBroker),
    [t, showBroker],
  );
  return { columns };
};
