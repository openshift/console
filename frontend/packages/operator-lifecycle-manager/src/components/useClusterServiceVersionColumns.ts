import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getNamespace } from '@console/shared/src/selectors/common';
import { ClusterServiceVersionModel } from '../models';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';
import { isCopiedCSV } from '../utils/clusterserviceversions';
import { sortByValue } from './dataViewSortHelpers';
import { operatorNamespaceFor, targetNamespacesFor } from './operator-group';

type InstalledOperator = ClusterServiceVersionKind | SubscriptionKind;

/** Column management id, shared with the page's `columnLayout`. */
export const csvColumnManagementID = 'operators.coreos.com~v1alpha1~ClusterServiceVersion';

const getOperatorNamespace = (obj: InstalledOperator): string | null =>
  operatorNamespaceFor(obj) ?? getNamespace(obj);

/**
 * Columns for the Installed Operators table.
 * @param allNamespaceActive - Whether the "All Projects" namespace is selected, which adds a Namespace column.
 * @param lifecycleEnabled - Whether the operator lifecycle metadata flag is on, which adds two columns.
 */
export const useClusterServiceVersionColumns = (
  allNamespaceActive: boolean,
  lifecycleEnabled: boolean,
): {
  columns: ConsoleDataViewColumn<InstalledOperator>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('olm');
  const { getResizableProps, getWidth, resetAllColumnWidths } = useColumnWidthSettings(
    ClusterServiceVersionModel,
  );

  const formatTargetNamespaces = useMemo(
    () =>
      (obj: InstalledOperator): string => {
        if (obj.kind === 'Subscription') {
          return t('None');
        }
        if (isCopiedCSV(obj)) {
          return obj.metadata.namespace;
        }
        const targetNamespaces = targetNamespacesFor(obj)?.split(',') ?? [];
        switch (targetNamespaces.length) {
          case 0:
            return t('All Namespaces');
          case 1:
            return targetNamespaces[0];
          default:
            return t('{{count}} Namespaces', { count: targetNamespaces.length });
        }
      },
    [t],
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
      ...(allNamespaceActive
        ? [
            {
              id: 'namespace',
              resizableProps: getResizableProps('namespace'),
              title: t('Namespace'),
              sort: sortByValue<InstalledOperator>(getOperatorNamespace),
              props: { modifier: 'nowrap' as const },
            },
          ]
        : []),
      {
        // Managed Namespaces can list several names, so it wraps rather than truncating. Give it a
        // default width so the header itself is not squeezed to an ellipsis.
        id: 'managedNamespaces',
        resizableProps: getResizableProps('managedNamespaces'),
        title: t('Managed Namespaces'),
        sort: sortByValue<InstalledOperator>(formatTargetNamespaces),
        props: {
          modifier: 'wrap' as const,
          style: { width: `${getWidth('managedNamespaces') ?? 180}px` },
        },
      },
      {
        id: 'status',
        resizableProps: getResizableProps('status'),
        title: t('Status'),
      },
      {
        id: 'providedAPIs',
        resizableProps: getResizableProps('providedAPIs'),
        title: t('Provided APIs'),
      },
      ...(lifecycleEnabled
        ? [
            {
              id: 'clusterCompatibility',
              resizableProps: getResizableProps('clusterCompatibility'),
              title: t('Cluster compatibility'),
              props: { modifier: 'nowrap' as const },
            },
            {
              id: 'supportPhase',
              resizableProps: getResizableProps('supportPhase'),
              title: t('Support phase'),
              props: { modifier: 'nowrap' as const },
            },
          ]
        : []),
      {
        id: 'lastUpdated',
        resizableProps: getResizableProps('lastUpdated'),
        title: t('Last updated'),
        props: { modifier: 'nowrap' as const },
      },
      { id: 'actions', title: '', props: cellIsStickyProps },
    ],
    [t, getResizableProps, getWidth, allNamespaceActive, lifecycleEnabled, formatTargetNamespaces],
  );
  return { columns, resetAllColumnWidths };
};
