import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { checkAccess } from '@console/internal/components/utils/rbac';
import { NodeModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { LazyConfigureUnschedulableModalOverlay } from './modals';
import { markNodesSchedulable, getSchedulingCounts } from './nodeSchedulingActions';

/** Returns bulk scheduling actions for the currently selected nodes. */
export const useCustomNodeActions = (selectedNodes: NodeKind[], onComplete: () => void) => {
  const { t } = useTranslation('console-app');
  const [handlePromise, inProgress] = usePromiseHandler();
  const launchModal = useOverlay();
  const [patchAccessAllowed, setPatchAccessAllowed] = useState<boolean>();

  useEffect(() => {
    let isCurrent = true;
    checkAccess({ group: NodeModel.apiGroup, resource: NodeModel.plural, verb: 'patch' })
      .then(({ status }) => {
        if (isCurrent) {
          setPatchAccessAllowed(status.allowed);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setPatchAccessAllowed(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const canPatchSelectedNodes = patchAccessAllowed === true;

  return useMemo<Action[]>(() => {
    if (selectedNodes.length === 0) return [];

    const { schedulableCount, unschedulableCount } = getSchedulingCounts(selectedNodes);
    return [
      {
        id: 'mark-schedulable',
        label: t('Mark schedulable'),
        description: t('Applies to {{count}} selected nodes that are currently unschedulable.', {
          count: unschedulableCount,
        }),
        disabled: inProgress || !canPatchSelectedNodes || unschedulableCount === 0,
        cta: () => {
          handlePromise(markNodesSchedulable(selectedNodes))
            .then(onComplete)
            .catch((error) => {
              launchModal(ErrorModal, {
                error: error?.message || t('An error occurred. Please try again'),
              });
            });
        },
      },
      {
        id: 'mark-unschedulable',
        label: t('Mark unschedulable'),
        description: t('Applies to {{count}} selected nodes that are schedulable.', {
          count: schedulableCount,
        }),
        disabled: inProgress || !canPatchSelectedNodes || schedulableCount === 0,
        cta: () =>
          launchModal(LazyConfigureUnschedulableModalOverlay, {
            nodes: selectedNodes,
            onComplete,
          }),
      },
    ];
  }, [canPatchSelectedNodes, handlePromise, inProgress, launchModal, onComplete, selectedNodes, t]);
};
