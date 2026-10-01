import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { CatalogSourceKind } from '../types';
import { sortByOptionalPath } from './dataViewSortHelpers';
import type { OperatorHubKind } from './operator-hub';

/**
 * A row in the OperatorHub Sources table: the default sources declared by the OperatorHub config
 * merged with the CatalogSources that actually exist. A disabled default source has no `source`.
 */
export type CatalogSourceTableRowObj = {
  availability: ReactNode;
  disabled?: boolean;
  endpoint?: ReactNode;
  isDefault?: boolean;
  name: string;
  namespace: string;
  operatorCount?: number;
  operatorHub: OperatorHubKind;
  publisher?: string;
  registryPollInterval?: string;
  status?: string;
  source?: CatalogSourceKind;
};

/**
 * Console-only model for column width preferences. Rows here are a synthetic merge of default and
 * custom sources, so the widths must not share a key with the generic CatalogSource list page.
 */
const OperatorHubSourcesListModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'OperatorHubSourcesList',
  plural: 'operatorhubsourceslists',
  label: 'CatalogSource',
  labelPlural: 'CatalogSources',
  abbr: 'CS',
};

export const useCatalogSourceColumns = (): {
  columns: ConsoleDataViewColumn<CatalogSourceTableRowObj>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('olm');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(
    OperatorHubSourcesListModel,
  );
  const columns = useMemo(
    () => [
      {
        id: 'name',
        resizableProps: getResizableProps('name'),
        title: t('Name'),
        sort: 'name',
        props: getNameColumnProps(),
      },
      {
        id: 'status',
        resizableProps: getResizableProps('status'),
        title: t('Status'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('status'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'publisher',
        resizableProps: getResizableProps('publisher'),
        title: t('Publisher'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('publisher'),
        props: { modifier: 'nowrap' as const },
      },
      {
        // `availability` is a ReactNode, so sort by the parallel string built in flatten().
        id: 'availability',
        resizableProps: getResizableProps('availability'),
        title: t('Availability'),
        sort: 'availabilitySort',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'endpoint',
        resizableProps: getResizableProps('endpoint'),
        title: t('Endpoint'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('endpoint'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'registryPollInterval',
        resizableProps: getResizableProps('registryPollInterval'),
        title: t('Registry poll interval'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('registryPollInterval'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'operatorCount',
        resizableProps: getResizableProps('operatorCount'),
        title: t('# of Operators'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('operatorCount'),
        props: { modifier: 'nowrap' as const },
      },
      { id: 'actions', title: '', props: cellIsStickyProps },
    ],
    [t, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};
