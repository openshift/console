import { useMemo, useCallback } from 'react';
import { ResponsiveAction } from '@patternfly/react-component-groups';
import { useTranslation } from 'react-i18next';
import type { NodeKind } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { isNodeUnschedulable } from '@console/shared/src/selectors/node';
import { makeNodeSchedulable, makeNodeUnschedulable } from '../../k8s/requests/nodes';

type UseBulkNodeActionsOptions = {
  selectedNodes: NodeKind[];
  onComplete: () => void;
};

export const useBulkNodeActions = ({ selectedNodes, onComplete }: UseBulkNodeActionsOptions) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress] = usePromiseHandler();

  const { schedulableCount, unschedulableCount } = useMemo(() => {
    let schedulable = 0;
    let unschedulable = 0;
    selectedNodes.forEach((node) => {
      if (isNodeUnschedulable(node)) {
        unschedulable++;
      } else {
        schedulable++;
      }
    });
    return { schedulableCount: schedulable, unschedulableCount: unschedulable };
  }, [selectedNodes]);

  const handleMarkSchedulable = useCallback(() => {
    const promises = selectedNodes
      .filter((node) => isNodeUnschedulable(node))
      .map((node) => makeNodeSchedulable(node));

    handlePromise(
      Promise.allSettled(promises).then((results) => {
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          throw new Error(
            t(
              'console-app~Failed to mark {{failureCount}} of {{totalCount}} nodes as schedulable',
              { failureCount: failures.length, totalCount: results.length },
            ),
          );
        }
      }),
    )
      .then(() => {
        onComplete();
      })
      .catch(() => {
        // Errors are handled by usePromiseHandler
      });
  }, [selectedNodes, handlePromise, t, onComplete]);

  const handleMarkUnschedulable = useCallback(() => {
    const promises = selectedNodes
      .filter((node) => !isNodeUnschedulable(node))
      .map((node) => makeNodeUnschedulable(node));

    handlePromise(
      Promise.allSettled(promises).then((results) => {
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          throw new Error(
            t(
              'console-app~Failed to mark {{failureCount}} of {{totalCount}} nodes as unschedulable',
              { failureCount: failures.length, totalCount: results.length },
            ),
          );
        }
      }),
    )
      .then(() => {
        onComplete();
      })
      .catch(() => {
        // Errors are handled by usePromiseHandler
      });
  }, [selectedNodes, handlePromise, t, onComplete]);

  return useMemo(() => {
    const actions: JSX.Element[] = [];

    if (unschedulableCount > 0) {
      actions.push(
        <ResponsiveAction
          key="mark-schedulable"
          onClick={handleMarkSchedulable}
          isDisabled={inProgress}
          data-test="bulk-mark-schedulable"
          isPinned
        >
          {t('console-app~Mark as schedulable ({{nodeCount}})', { nodeCount: unschedulableCount })}
        </ResponsiveAction>,
      );
    }

    if (schedulableCount > 0) {
      actions.push(
        <ResponsiveAction
          key="mark-unschedulable"
          onClick={handleMarkUnschedulable}
          isDisabled={inProgress}
          data-test="bulk-mark-unschedulable"
          isPinned
        >
          {t('console-app~Mark as unschedulable ({{nodeCount}})', { nodeCount: schedulableCount })}
        </ResponsiveAction>,
      );
    }

    return actions;
  }, [
    unschedulableCount,
    schedulableCount,
    handleMarkSchedulable,
    handleMarkUnschedulable,
    inProgress,
    t,
  ]);
};
