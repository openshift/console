import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import type { EventChannelKind } from '../../../types';

/** Console-only model for column width preferences across all channel kinds. */
const KnativeChannelsCombinedListModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'KnativeChannelsCombinedList',
  plural: 'knativechannelscombinedlists',
  label: 'Channel',
  labelPlural: 'Channels',
  abbr: 'C',
};

export const useChannelColumns = (): {
  columns: ConsoleDataViewColumn<EventChannelKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('knative-plugin');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(
    KnativeChannelsCombinedListModel,
  );
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
        id: 'type',
        resizableProps: getResizableProps('type'),
        title: t('Type'),
        sort: 'kind',
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
