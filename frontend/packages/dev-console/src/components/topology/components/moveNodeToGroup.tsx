import * as React from 'react';
import { confirmModal, errorModal } from '@console/internal/components/modals';
import { Node } from '@patternfly/react-topology';
import { updateTopologyResourceApplication } from '../topology-utils';

export const moveNodeToGroup = (node: Node, targetGroup: Node): Promise<void> => {
  const sourceGroup = node.getParent() !== node.getGraph() ? (node.getParent() as Node) : undefined;
  if (sourceGroup === targetGroup) {
    return Promise.reject();
  }

  if (sourceGroup) {
    const title = targetGroup ? 'Move Component Node' : 'Remove Component Node from Application';
    const message = (
      <>
        Are you sure you want to {targetGroup ? 'move' : 'remove'}{' '}
        <strong>{node.getLabel()}</strong> from {sourceGroup.getLabel()}
        {targetGroup ? ` to ${targetGroup.getLabel()}` : ''}?
      </>
    );
    const btnText = targetGroup ? 'Move' : 'Remove';

    return new Promise((resolve, reject) => {
      confirmModal({
        title,
        message,
        btnText,
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
              errorModal({ error });
              reject(err);
            });
        },
      });
    });
  }

  return updateTopologyResourceApplication(node, targetGroup.getLabel()).catch((err) => {
    const error = err.message;
    errorModal({ error });
  });
};
