import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ServiceModel } from '../../models';
import type { ServiceKind } from '../../types';

export const useServiceColumns = (): {
  columns: ConsoleDataViewColumn<ServiceKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('knative-plugin');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(ServiceModel);
  const columns = useMemo(
    () => [
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
        id: 'url',
        resizableProps: getResizableProps('url'),
        title: t('URL'),
        sort: 'status.url',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'conditions',
        resizableProps: getResizableProps('conditions'),
        title: t('Conditions'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'ready',
        resizableProps: getResizableProps('ready'),
        title: t('Ready'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'reason',
        resizableProps: getResizableProps('reason'),
        title: t('Reason'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'revision',
        resizableProps: getResizableProps('revision'),
        title: t('Revision'),
        sort: 'metadata.generation',
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
    ],
    [t, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};
