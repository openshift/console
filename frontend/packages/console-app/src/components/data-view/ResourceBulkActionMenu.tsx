import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { MenuToggle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type {
  Action,
  BulkResourceActionContext,
  ResourceActionProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { isResourceActionProvider } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import ActionsHookResolver from '@console/shared/src/components/actions/loader/ActionsHookResolver';
import { ActionMenu } from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';

type ResourceBulkActionMenuProps = BulkResourceActionContext & {
  reference?: string;
  localActions?: Action[];
  selectedCount: number;
  selectionKey: string;
};

/** Combines table actions with bulk providers for a single resource model. */
export const ResourceBulkActionMenu: FC<ResourceBulkActionMenuProps> = ({
  reference,
  resources,
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
  const providers = useMemo(
    () =>
      resolvedExtensions
        .filter(providerGuard)
        .sort((a, b) => a.pluginName.localeCompare(b.pluginName) || a.uid.localeCompare(b.uid)),
    [resolvedExtensions, providerGuard],
  );
  const scope = useMemo<BulkResourceActionContext>(
    () => ({ resources, getResourceId, clearSelection, deselect }),
    [resources, getResourceId, clearSelection, deselect],
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
    ].filter(({ id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [localActions, providers, providerActions, selectionKey]);

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
      {(Boolean(localActions?.length) || providers.length > 0) &&
        (actions.length === 0 ? (
          <MenuToggle isDisabled aria-label={t('Bulk actions')} aria-haspopup="true">
            {t('Bulk actions')}
          </MenuToggle>
        ) : (
          <ActionMenu
            actions={actions}
            variant={ActionMenuVariant.DROPDOWN}
            label={t('Bulk actions')}
            isDisabled={selectedCount === 0 || actions.every(({ disabled }) => disabled)}
          />
        ))}
    </>
  );
};
