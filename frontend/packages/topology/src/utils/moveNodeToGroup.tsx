import { useCallback, useEffect } from 'react';
import { Node } from '@patternfly/react-topology';
import { Trans } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { confirmModal } from '@console/internal/components/modals';
import { ErrorModal, ErrorModalProps } from '@console/internal/components/modals/error-modal';
import { updateTopologyResourceApplication } from './topology-utils';

// Module-level error handler that can be set by the Topology component
let globalErrorHandler: ((error: string) => void) | null = null;

export const setMoveNodeToGroupErrorHandler = (handler: ((error: string) => void) | null) => {
  globalErrorHandler = handler;
};

export const moveNodeToGroup = (
  node: Node,
  targetGroup: Node,
  onError?: (error: string) => void,
): Promise<void> => {
  const sourceGroup = node.getParent() !== node.getGraph() ? (node.getParent() as Node) : undefined;
  if (sourceGroup === targetGroup) {
    return Promise.reject();
  }

  if (sourceGroup) {
    // t('topology~Move component node')
    // t('topology~Remove component node from application')
    const titleKey = targetGroup
      ? 'topology~Move component node'
      : 'topology~Remove component node from application';
    const nodeLabel = node.getLabel();
    const sourceLabel = sourceGroup.getLabel();
    const targetLabel = targetGroup?.getLabel();
    const message = targetGroup ? (
      <Trans ns="topology">
        Are you sure you want to move <strong>{{ nodeLabel }}</strong> from {{ sourceLabel }} to{' '}
        {{ targetLabel }}?
      </Trans>
    ) : (
      <Trans ns="topology">
        Are you sure you want to remove <strong>{{ nodeLabel }}</strong> from {{ sourceLabel }}?
      </Trans>
    );
    // t('topology~Move')
    // t('topology~Remove')
    const btnTextKey = targetGroup ? 'topology~Move' : 'topology~Remove';

    return new Promise((resolve, reject) => {
      confirmModal({
        titleKey,
        message,
        btnTextKey,
        close: () => {
          reject();
        },
        cancel: () => {
          reject();
        },
        executeFn: () => {
          return updateTopologyResourceApplication(
            node,
            targetGroup ? targetGroup.getLabel() : null,
          )
            .then(resolve)
            .catch((err) => {
              const error = err.message;
              const errorHandler = onError || globalErrorHandler;
              if (errorHandler) {
                errorHandler(error);
              }
              reject(err);
            });
        },
      });
    });
  }

  return updateTopologyResourceApplication(node, targetGroup.getLabel()).catch((err) => {
    const error = err.message;
    const errorHandler = onError || globalErrorHandler;
    if (errorHandler) {
      errorHandler(error);
    }
  });
};

/**
 * Hook that sets up error handling for moveNodeToGroup using useOverlay.
 * This sets a global error handler that will be used by all moveNodeToGroup calls.
 */
export const useSetupMoveNodeToGroupErrorHandler = () => {
  const launcher = useOverlay();

  useEffect(() => {
    const errorHandler = (error: string) => {
      launcher<ErrorModalProps>(ErrorModal, { error });
    };

    setMoveNodeToGroupErrorHandler(errorHandler);

    return () => {
      setMoveNodeToGroupErrorHandler(null);
    };
    // Intentionally only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * @deprecated Use useSetupMoveNodeToGroupErrorHandler in the parent component instead
 * Hook that provides a moveNodeToGroup function with error handling using useOverlay.
 */
export const useMoveNodeToGroup = () => {
  const launcher = useOverlay();

  return useCallback(
    (node: Node, targetGroup: Node) => {
      return moveNodeToGroup(node, targetGroup, (error) => {
        launcher<ErrorModalProps>(ErrorModal, { error });
      });
    },
    [launcher],
  );
};
