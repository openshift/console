import * as React from 'react';
import { Edge } from '@console/topology';
import { YellowExclamationTriangleIcon } from '@console/shared/src';
import { confirmModal, errorModal } from '@console/internal/components/modals';
import { removeTopologyResourceConnection } from '../topology-utils';

export const removeConnection = (edge: Edge): Promise<any> => {
  const message = (
    <div className="co-delete-modal">
      <YellowExclamationTriangleIcon className="co-delete-modal__icon" />
      {edge.getType() === 'service-binding' ? (
        <p>
          Deleting the binding connector deletes the config details of the source and removes the
          binding resources. Are you sure you want to delete the binding connector?
        </p>
      ) : (
        <p>
          Deleting the visual connector removes the `connects-to` annotation from the resources. Are
          you sure you want to delete the visual connector?
        </p>
      )}
    </div>
  );

  return confirmModal({
    title: 'Delete Connector',
    message,
    btnText: 'Delete',
    submitDanger: true,
    executeFn: () => {
      return removeTopologyResourceConnection(
        edge.getSource().getData(),
        edge.getTarget().getData(),
        edge.getData().data && edge.getData().data.sbr,
        edge.getType(),
      ).catch((err) => {
        err && errorModal({ error: err.message });
      });
    },
  });
};
