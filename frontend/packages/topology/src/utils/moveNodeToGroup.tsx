import type { Node } from '@patternfly/react-topology';
import i18next from 'i18next';
import { Trans } from 'react-i18next';
import { launchErrorModal } from '@console/shared/src/utils/error-modal-handler';
import { launchWarningModal } from '@console/shared/src/utils/warning-modal-handler';
import { updateTopologyResourceApplication } from './topology-utils';

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

    // Blur active element to prevent aria-hidden focus violations when modal opens
    // This fixes the browser warning: "Blocked aria-hidden on an element because its
    // descendant retained focus" when focus remains on SVG elements during drag-drop
    if (
      document.activeElement instanceof HTMLElement ||
      document.activeElement instanceof SVGElement
    ) {
      document.activeElement.blur();
    }

    return new Promise<void>((resolve, reject) => {
      launchWarningModal(
        {
          title: i18next.t(titleKey),
          children: message,
          confirmButtonLabel: i18next.t(btnTextKey),
          titleIconVariant: null,
        },
        () => {
          // User confirmed - proceed with move/remove
          updateTopologyResourceApplication(node, targetGroup ? targetGroup.getLabel() : null)
            .then(() => resolve())
            .catch((err) => {
              const error = err.message;
              if (onError) {
                onError(error);
              } else {
                launchErrorModal({ error });
              }
              reject(err);
            });
        },
        () => {
          // User cancelled - reject to signal operation was cancelled
          reject(new Error('User cancelled'));
        },
      );
    });
  }

  return updateTopologyResourceApplication(node, targetGroup.getLabel()).catch((err) => {
    const error = err.message;
    if (onError) {
      onError(error);
    } else {
      launchErrorModal({ error });
    }
  });
};
