import * as React from 'react';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { modelFor } from '../../module/k8s';
import { confirmModal } from '../modals/confirm-modal';

const confirmNavUnpinModal = (resource: string, pinnedResources: string[], updatePinsFn) => {
  const executeFn = () => {
    const updatedPinnedResources = [...pinnedResources];
    const index = pinnedResources.indexOf(resource);
    if (index >= 0) {
      updatedPinnedResources.splice(index, 1);
      updatePinsFn(updatedPinnedResources);
    }
    return Promise.resolve();
  };

  const label = modelFor(resource)?.labelPlural;
  const title = (
    <>
      <YellowExclamationTriangleIcon className="co-icon-space-r" /> Remove from navigation?
    </>
  );
  const message = (
    <span>
      Are you sure you want to remove <strong>{label}</strong> from navigation?
    </span>
  );

  return confirmModal({
    title,
    message,
    btnText: 'Remove',
    submitDanger: true,
    executeFn,
  });
};

export default confirmNavUnpinModal;
