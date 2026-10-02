import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { RouteKind } from '../../types';

export const useRouteColumns = (): {
  columns: ConsoleDataViewColumn<RouteKind>[];
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
        id: 'created',
        title: t('Created'),
        sort: 'metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'conditions',
        title: t('Conditions'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'traffic',
        title: t('Traffic'),
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: 'actions' },
    ],
    [t],
  );
  return { columns };
};
