import * as React from 'react';
import { Edge } from '@console/topology';
import { YellowExclamationTriangleIcon } from '@console/shared/src';
import { confirmModal, errorModal } from '@console/internal/components/modals';
import { removeTopologyResourceConnection } from '../topology-utils';

export const removeConnection = (edge: Edge): Promise<any> => {
  const message = (
    <p>
      Deleting the visual connector removes the `connects-to` annotation from the resources. Are you
      sure you want to delete the visual connector?
    </p>
  );

  return confirmModal({
    title: (
      <>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete Connector?
      </>
    ),
    message,
    btnText: 'Delete',
    submitDanger: true,
    executeFn: () => {
      return removeTopologyResourceConnection(edge).catch((err) => {
        err && errorModal({ error: err.message });
      });
    },
  });
};
