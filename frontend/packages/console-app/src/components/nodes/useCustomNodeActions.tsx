import { useMemo, useCallback } from 'react';
import { DropdownItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { NodeKind } from '@console/internal/module/k8s';
import { ResponsiveActionDropdown } from '@console/shared/src/components/dropdown/ResponsiveActionDropdown';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { LazyConfigureUnschedulableModalOverlay } from './modals';
import { markNodesSchedulable, getSchedulingCounts } from './nodeSchedulingActions';

type UseCustomNodeActionsOptions = {
  selectedNodes: NodeKind[];
  onComplete: () => void;
};

/**
 * Hook for custom node actions dropdown.
 * Returns a ResponsiveActionDropdown that should be used with customActions prop.
 * Shows as primary button on desktop (md breakpoint and above), kebab button on mobile.
 */
export const useCustomNodeActions = ({
  selectedNodes,
  onComplete,
}: UseCustomNodeActionsOptions) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress] = usePromiseHandler();
  const launchModal = useOverlay();

  const { schedulableCount, unschedulableCount } = useMemo(
    () => getSchedulingCounts(selectedNodes),
    [selectedNodes],
  );

  const handleMarkSchedulable = useCallback(() => {
    handlePromise(markNodesSchedulable(selectedNodes))
      .then(() => {
        onComplete();
      })
      .catch(() => {
        // Errors are handled by usePromiseHandler
      });
  }, [selectedNodes, handlePromise, onComplete]);

  const handleMarkUnschedulable = useCallback(() => {
    launchModal(LazyConfigureUnschedulableModalOverlay, {
      nodes: selectedNodes,
      onComplete,
    });
  }, [selectedNodes, launchModal, onComplete]);

  return useMemo(() => {
    const dropdownItems: JSX.Element[] = [];

    if (unschedulableCount > 0) {
      dropdownItems.push(
        <DropdownItem
          key="mark-schedulable"
          onClick={handleMarkSchedulable}
          isDisabled={inProgress}
          data-test="bulk-mark-schedulable"
          description={t(
            'console-app~Applies to {{nodeCount}} selected nodes that are currently unschedulable.',
            { nodeCount: unschedulableCount },
          )}
        >
          {t('console-app~Mark schedulable')}
        </DropdownItem>,
      );
    }

    if (schedulableCount > 0) {
      dropdownItems.push(
        <DropdownItem
          key="mark-unschedulable"
          onClick={handleMarkUnschedulable}
          isDisabled={inProgress}
          data-test="bulk-mark-unschedulable"
          description={t(
            'console-app~Applies to {{nodeCount}} selected nodes that are currently schedulable.',
            { nodeCount: schedulableCount },
          )}
        >
          {t('console-app~Mark unschedulable')}
        </DropdownItem>,
      );
    }

    const hasNoApplicableActions = dropdownItems.length === 0;
    const isDisabled = inProgress || selectedNodes.length === 0 || hasNoApplicableActions;

    return (
      <ResponsiveActionDropdown
        label={t('console-app~Scheduling')}
        isDisabled={isDisabled}
        data-test="bulk-actions-dropdown"
      >
        {dropdownItems}
      </ResponsiveActionDropdown>
    );
  }, [
    unschedulableCount,
    schedulableCount,
    inProgress,
    selectedNodes.length,
    t,
    handleMarkSchedulable,
    handleMarkUnschedulable,
  ]);
};
