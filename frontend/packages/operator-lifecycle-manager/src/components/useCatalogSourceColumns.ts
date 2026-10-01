import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
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

export const useCatalogSourceColumns = (): {
  columns: ConsoleDataViewColumn<CatalogSourceTableRowObj>[];
} => {
  const { t } = useTranslation('olm');
  const columns = useMemo(
    () => [
      {
        id: 'name',
        title: t('Name'),
        sort: 'name',
        props: getNameColumnProps(),
      },
      {
        id: 'status',
        title: t('Status'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('status'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'publisher',
        title: t('Publisher'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('publisher'),
        props: { modifier: 'nowrap' as const },
      },
      {
        // `availability` is a ReactNode, so sort by the parallel string built in flatten().
        id: 'availability',
        title: t('Availability'),
        sort: 'availabilitySort',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'endpoint',
        title: t('Endpoint'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('endpoint'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'registryPollInterval',
        title: t('Registry poll interval'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('registryPollInterval'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'operatorCount',
        title: t('# of Operators'),
        sort: sortByOptionalPath<CatalogSourceTableRowObj>('operatorCount'),
        props: { modifier: 'nowrap' as const },
      },
      { id: 'actions', title: '', props: cellIsStickyProps },
    ],
    [t],
  );
  return { columns };
};
