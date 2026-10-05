import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ServiceKind } from '../../types';

export const useServiceColumns = (): {
  columns: ConsoleDataViewColumn<ServiceKind>[];
} => {
  const { t } = useTranslation('knative-plugin');
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
        id: 'url',
        title: t('URL'),
        sort: 'status.url',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'conditions',
        title: t('Conditions'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'ready',
        title: t('Ready'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'reason',
        title: t('Reason'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'revision',
        title: t('Revision'),
        sort: 'metadata.generation',
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
