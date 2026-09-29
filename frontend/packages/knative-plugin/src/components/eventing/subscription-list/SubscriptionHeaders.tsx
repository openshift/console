import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { EventingSubscriptionModel } from '../../../models';
import type { EventSubscriptionKind } from '../../../types';

export const useSubscriptionColumns = (
  showChannel: boolean,
): {
  columns: ConsoleDataViewColumn<EventSubscriptionKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('knative-plugin');
  const { getResizableProps, resetAllColumnWidths } =
    useColumnWidthSettings(EventingSubscriptionModel);
  const columns = useMemo(
    () =>
      [
        {
          id: 'name',
          resizableProps: getResizableProps('name'),
          title: t('Name'),
          sort: 'metadata.name',
          props: getNameColumnProps(),
        },
        {
          id: 'namespace',
          resizableProps: getResizableProps('namespace'),
          title: t('Namespace'),
          sort: 'metadata.namespace',
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'ready',
          resizableProps: getResizableProps('ready'),
          title: t('Ready'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'condition',
          resizableProps: getResizableProps('condition'),
          title: t('Conditions'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'channel',
          resizableProps: getResizableProps('channel'),
          title: t('Channel'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'subscriber',
          resizableProps: getResizableProps('subscriber'),
          title: t('Subscriber'),
          props: { modifier: 'nowrap' as const },
        },
        {
          id: 'created',
          resizableProps: getResizableProps('created'),
          title: t('Created'),
          sort: 'metadata.creationTimestamp',
          props: { modifier: 'nowrap' as const },
        },
        { id: 'actions', title: '', props: cellIsStickyProps },
      ].filter(({ id }) => id !== 'channel' || showChannel),
    [t, showChannel, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};
