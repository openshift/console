import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { SubscriptionKind } from '../types';

export const useSubscriptionColumns = (): {
  columns: ConsoleDataViewColumn<SubscriptionKind>[];
} => {
  const { t } = useTranslation('olm');
  const columns = useMemo(
    () => [
      { type: 'name' as const, id: 'name', title: t('Name'), sort: 'metadata.name' },
      {
        id: 'namespace',
        title: t('Namespace'),
        sort: 'metadata.namespace',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'status',
        title: t('Status'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'channel',
        title: t('Update channel'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'approval',
        title: t('Update approval'),
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: 'actions' },
    ],
    [t],
  );
  return { columns };
};
