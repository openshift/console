import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { EventBrokerKind } from '../../../types';

export const useBrokerColumns = (): {
  columns: ConsoleDataViewColumn<EventBrokerKind>[];
} => {
  const { t } = useTranslation('knative-plugin');
  const columns = useMemo(
    () => [
      { type: 'name' as const, id: 'name' },
      {
        type: 'namespace' as const,
        id: 'namespace',
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
        id: 'created',
        title: t('Created'),
        sort: 'metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: 'actions' },
    ],
    [t],
  );
  return { columns };
};
