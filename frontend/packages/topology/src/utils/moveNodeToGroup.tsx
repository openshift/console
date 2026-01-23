import { useCallback, useEffect } from 'react';
import { Node } from '@patternfly/react-topology';
import { Trans, useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal, ErrorModalProps } from '@console/internal/components/modals/error-modal';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { updateTopologyResourceApplication } from './topology-utils';

// Module-level error handler that can be set by the Topology component
let globalErrorHandler: ((error: string) => void) | null = null;

export const setMoveNodeToGroupErrorHandler = (handler: ((error: string) => void) | null) => {
  globalErrorHandler = handler;
};

// Module-level confirm handler that can be set by the Topology component
let globalConfirmHandler:
  | ((
      title: string,
      message: React.ReactNode,
      confirmButtonText: string,
      onConfirm: () => Promise<void>,
      onCancel: () => void,
    ) => void)
  | null = null;

export const setMoveNodeToGroupConfirmHandler = (
  handler:
    | ((
        title: string,
        message: React.ReactNode,
        confirmButtonText: string,
        onConfirm: () => Promise<void>,
        onCancel: () => void,
      ) => void)
    | null,
) => {
  globalConfirmHandler = handler;
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
    const nodeLabel = node.getLabel();
    const sourceLabel = sourceGroup.getLabel();
    const targetLabel = targetGroup?.getLabel();

    // t('topology~Move component node')
    // t('topology~Remove component node from application')
    const title = targetGroup ? 'Move component node' : 'Remove component node from application';

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
    const confirmButtonText = targetGroup ? 'Move' : 'Remove';

    return new Promise((resolve, reject) => {
      if (!globalConfirmHandler) {
        reject(new Error('Confirm handler not initialized'));
        return;
      }

      const handleConfirm = () => {
        return updateTopologyResourceApplication(node, targetGroup ? targetGroup.getLabel() : null)
          .then(resolve)
          .catch((err) => {
            const error = err.message;
            const errorHandler = onError || globalErrorHandler;
            if (errorHandler) {
              errorHandler(error);
            }
            reject(err);
          });
      };

      const handleCancel = () => {
        reject(new Error('User cancelled'));
      };

      globalConfirmHandler(title, message, confirmButtonText, handleConfirm, handleCancel);
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
 * Hook that sets up both error and confirm handling for moveNodeToGroup using useOverlay.
 * This sets global handlers that will be used by all moveNodeToGroup calls.
 */
export const useSetupMoveNodeToGroupHandlers = () => {
  const { t } = useTranslation();
  const launcher = useOverlay();
  const launchWarningModal = useWarningModal();

  useEffect(() => {
    const errorHandler = (error: string) => {
      launcher<ErrorModalProps>(ErrorModal, { error });
    };

    const confirmHandler = (
      title: string,
      message: React.ReactNode,
      confirmButtonText: string,
      onConfirm: () => Promise<void>,
      onCancel: () => void,
    ) => {
      launchWarningModal({
        title: t(`topology~${title}`),
        children: message,
        confirmButtonLabel: t(`topology~${confirmButtonText}`),
        onConfirm,
        onClose: onCancel,
      });
    };

    setMoveNodeToGroupErrorHandler(errorHandler);
    setMoveNodeToGroupConfirmHandler(confirmHandler);

    return () => {
      setMoveNodeToGroupErrorHandler(null);
      setMoveNodeToGroupConfirmHandler(null);
    };
    // Intentionally only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * @deprecated Use useSetupMoveNodeToGroupHandlers in the parent component instead
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
