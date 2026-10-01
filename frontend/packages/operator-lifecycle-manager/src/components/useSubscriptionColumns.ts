import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { SubscriptionKind } from '../types';

export const useSubscriptionColumns = (): {
  columns: ConsoleDataViewColumn<SubscriptionKind>[];
} => {
  const { t } = useTranslation('olm');
  const columns = useMemo(
    () => [
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
      { id: 'actions', title: '', props: cellIsStickyProps },
    ],
    [t],
  );
  return { columns };
};
