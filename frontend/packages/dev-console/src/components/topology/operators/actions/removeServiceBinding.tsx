import * as React from 'react';
import { confirmModal, errorModal } from '@console/internal/components/modals';
import { YellowExclamationTriangleIcon } from '@console/shared/src';
import { Edge } from '@console/topology';
import { k8sKill } from '@console/internal/module/k8s';
import { ServiceBindingRequestModel } from '../../../../models';

export const removeServiceBinding = (edge: Edge): Promise<any> => {
  const message = (
    <p>
      Deleting the binding connector deletes the config details of the source and removes the
      binding resources. Are you sure you want to delete the binding connector?
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
      const sbr = edge.getData()?.sbr;
      if (sbr) {
        return k8sKill(ServiceBindingRequestModel, sbr).catch((err) => {
          err && errorModal({ error: err.message });
        });
      }
      return Promise.resolve('Unable to bind service binding.');
    },
  });
};
