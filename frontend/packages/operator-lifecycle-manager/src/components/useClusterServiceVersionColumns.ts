import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getNamespace } from '@console/shared/src/selectors/common';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';
import { isCopiedCSV } from '../utils/clusterserviceversions';
import { sortByValue } from './dataViewSortHelpers';
import { operatorNamespaceFor, targetNamespacesFor } from './operator-group';

type InstalledOperator = ClusterServiceVersionKind | SubscriptionKind;

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
} => {
  const { t } = useTranslation('olm');

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
      { type: 'name' as const, id: 'name', title: t('Name'), sort: 'metadata.name' },
      ...(allNamespaceActive
        ? [
            {
              id: 'namespace',
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
        title: t('Managed Namespaces'),
        sort: sortByValue<InstalledOperator>(formatTargetNamespaces),
        props: {
          modifier: 'wrap' as const,
          style: { width: '180px' },
        },
      },
      {
        id: 'status',
        title: t('Status'),
      },
      {
        id: 'providedAPIs',
        title: t('Provided APIs'),
      },
      ...(lifecycleEnabled
        ? [
            {
              id: 'clusterCompatibility',
              title: t('Cluster compatibility'),
              props: { modifier: 'nowrap' as const },
            },
            {
              id: 'supportPhase',
              title: t('Support phase'),
              props: { modifier: 'nowrap' as const },
            },
          ]
        : []),
      {
        id: 'lastUpdated',
        title: t('Last updated'),
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: 'actions' },
    ],
    [t, allNamespaceActive, lifecycleEnabled, formatTargetNamespaces],
  );
  return { columns };
};
