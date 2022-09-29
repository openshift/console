import * as React from 'react';
import i18next from 'i18next';
import { Trans } from 'react-i18next';
import { confirmModal } from '@console/internal/components/modals';
import { modelFor } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';

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
      <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
      {i18next.t('console-app~Remove from navigation?')}
    </>
  );
  const message = (
    <span>
      <Trans ns="public">
        Are you sure you want to remove <strong>{{ label }}</strong> from navigation?
      </Trans>
    </span>
  );

  return confirmModal({
    title,
    message,
    btnText: i18next.t('console-app~Remove'),
    submitDanger: true,
    executeFn,
  });
};

export default confirmNavUnpinModal;
