import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { asAccessReview, checkAccess } from '@console/internal/components/utils/rbac';
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
  const selectedNodesKey = JSON.stringify(selectedNodes.map(({ metadata: { uid } }) => uid).sort());
  const selectedNodesRef = useRef(selectedNodes);
  const [patchAccessReview, setPatchAccessReview] = useState<{
    key: string;
    allowed: boolean;
  }>();

  useEffect(() => {
    selectedNodesRef.current = selectedNodes;
  }, [selectedNodes]);

  useEffect(() => {
    let isCurrent = true;
    const nodes = selectedNodesRef.current;
    if (nodes.length === 0) return undefined;

    Promise.all(nodes.map((node) => checkAccess(asAccessReview(NodeModel, node, 'patch'))))
      .then((reviews) => {
        if (isCurrent) {
          setPatchAccessReview({
            key: selectedNodesKey,
            allowed: reviews.every(({ status }) => status.allowed),
          });
        }
      })
      .catch(() => {
        if (isCurrent) {
          setPatchAccessReview({ key: selectedNodesKey, allowed: false });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedNodesKey]);

  const canPatchSelectedNodes =
    selectedNodes.length > 0 &&
    patchAccessReview?.key === selectedNodesKey &&
    patchAccessReview.allowed;

  return useMemo<Action[]>(() => {
    if (!canPatchSelectedNodes) {
      return [];
    }

    const { schedulableCount, unschedulableCount } = getSchedulingCounts(selectedNodes);
    return [
      {
        id: 'mark-schedulable',
        label: t('Mark schedulable'),
        description: t('Applies to {{count}} selected nodes that are currently unschedulable.', {
          count: unschedulableCount,
        }),
        disabled: inProgress || unschedulableCount === 0,
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
        disabled: inProgress || schedulableCount === 0,
        cta: () =>
          launchModal(LazyConfigureUnschedulableModalOverlay, {
            nodes: selectedNodes,
            onComplete,
          }),
      },
    ];
  }, [canPatchSelectedNodes, handlePromise, inProgress, launchModal, onComplete, selectedNodes, t]);
};
