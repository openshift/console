import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { RevisionModel } from '../../models';
import type { RevisionKind } from '../../types';

export const useRevisionColumns = (): {
  columns: ConsoleDataViewColumn<RevisionKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('knative-plugin');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(RevisionModel);
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
        id: 'service',
        resizableProps: getResizableProps('service'),
        title: t('Service'),
        sort: 'metadata.labels["serving.knative.dev/service"]',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'created',
        resizableProps: getResizableProps('created'),
        title: t('Created'),
        sort: 'metadata.creationTimestamp',
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
      { id: 'actions', title: '', props: cellIsStickyProps },
    ],
    [t, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};
