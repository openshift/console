import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type {
  Action,
  ActionFilter,
  ActionGroup,
  BulkResourceActionContext,
  ResourceActionProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import {
  isActionFilter,
  isActionGroup,
  isResourceActionProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import ActionsHookResolver from '@console/shared/src/components/actions/loader/ActionsHookResolver';
import ActionMenuContent from '@console/shared/src/components/actions/menu/ActionMenuContent';
import { createMenuOptions } from '@console/shared/src/components/actions/utils';
import { ResponsiveActionDropdown } from '@console/shared/src/components/dropdown/ResponsiveActionDropdown';

type ResourceBulkActionMenuProps = BulkResourceActionContext & {
  reference?: string;
  localActions?: Action[];
  selectedCount: number;
  selectionKey: string;
};

/** Combines table actions with bulk providers for a single resource model. */
export const ResourceBulkActionMenu: FC<ResourceBulkActionMenuProps> = ({
  reference,
  matchingSelectedResources,
  getResourceId,
  clearSelection,
  deselect,
  localActions,
  selectedCount,
  selectionKey,
}) => {
  const { t } = useTranslation('console-app');
  const [providerActions, setProviderActions] = useState<{
    selectionKey: string;
    actionsByProvider: Record<string, Action[]>;
  }>({ selectionKey: '', actionsByProvider: {} });
  const providerGuard = useCallback(
    (extension): extension is ResourceActionProvider =>
      Boolean(reference) &&
      isResourceActionProvider(extension) &&
      Boolean(extension.properties.bulkProvider) &&
      referenceForExtensionModel({
        ...extension.properties.model,
        group: extension.properties.model.group ?? 'core',
      }) === reference,
    [reference],
  );
  const [resolvedExtensions] = useResolvedExtensions<ResourceActionProvider>(providerGuard);
  const filterGuard = useCallback(
    (extension: Extension): extension is ActionFilter =>
      Boolean(reference) &&
      isActionFilter(extension) &&
      extension.properties.contextId === reference,
    [reference],
  );
  const [filters, filtersResolved] = useResolvedExtensions(filterGuard);
  const [groups, groupsResolved] = useResolvedExtensions<ActionGroup>(isActionGroup);
  const providers = useMemo(
    () =>
      resolvedExtensions
        .filter(providerGuard)
        .sort((a, b) => a.pluginName.localeCompare(b.pluginName) || a.uid.localeCompare(b.uid)),
    [resolvedExtensions, providerGuard],
  );
  const scope = useMemo<BulkResourceActionContext>(
    () => ({ matchingSelectedResources, getResourceId, clearSelection, deselect }),
    [matchingSelectedResources, getResourceId, clearSelection, deselect],
  );
  const onActionsResolved = useCallback(
    (uid: string, actions: Action[]) => {
      setProviderActions((current) => {
        const actionsByProvider =
          current.selectionKey === selectionKey ? current.actionsByProvider : {};
        return {
          selectionKey,
          actionsByProvider: { ...actionsByProvider, [uid]: actions },
        };
      });
    },
    [selectionKey],
  );
  const actions = useMemo(() => {
    const seen = new Set<string>();
    const actionsByProvider =
      providerActions.selectionKey === selectionKey ? providerActions.actionsByProvider : {};
    return [
      ...(localActions ?? []),
      ...providers.flatMap(({ uid }) => actionsByProvider[uid] ?? []),
    ].filter((action) => {
      const { id } = action;
      if (seen.has(id)) return false;
      seen.add(id);
      return (
        filtersResolved &&
        (filters.length === 0 ||
          matchingSelectedResources.every((resource) =>
            filters.some(({ properties }) => properties.filter(resource, action)),
          ))
      );
    });
  }, [
    localActions,
    providers,
    providerActions,
    selectionKey,
    filters,
    filtersResolved,
    matchingSelectedResources,
  ]);
  const options = useMemo(
    () => (groupsResolved ? createMenuOptions(actions, groups) : []),
    [actions, groups, groupsResolved],
  );

  return (
    <>
      {selectedCount > 0 &&
        providers.map(({ uid, properties }) => (
          <ActionsHookResolver
            key={`${uid}:${selectionKey}`}
            scope={scope}
            useValue={properties.bulkProvider}
            onValueResolved={(value) => onActionsResolved(uid, value)}
            onValueError={(error) => console.warn('Could not load bulk resource actions', error)}
            onContextChange={() => {}}
          />
        ))}
      {(Boolean(localActions?.length) || providers.length > 0) && (
        <ResponsiveActionDropdown
          label={t('Actions')}
          variant="default"
          containsFlyout
          data-test="data-view-bulk-actions-menu-button"
          isDisabled={
            selectedCount === 0 || !groupsResolved || actions.every(({ disabled }) => disabled)
          }
        >
          {(closeDropdown) => <ActionMenuContent options={options} onClick={closeDropdown} />}
        </ResponsiveActionDropdown>
      )}
    </>
  );
};
