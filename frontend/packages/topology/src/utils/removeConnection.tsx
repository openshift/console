import * as React from 'react';
import { Edge } from '@patternfly/react-topology';
import { Trans } from 'react-i18next';
import { confirmModal, errorModal } from '@console/internal/components/modals';
import { YellowExclamationTriangleIcon } from '@console/shared/src';
import { removeTopologyResourceConnection } from './topology-utils';

export const removeConnection = (edge: Edge): Promise<any> => {
  const messageKey =
    // t('topology~Deleting the visual connector removes the `connects-to` annotation from the resources. Are you sure you want to delete the visual connector?')
    'topology~Deleting the visual connector removes the `connects-to` annotation from the resources. Are you sure you want to delete the visual connector?';
  return confirmModal({
    title: (
      <>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        <Trans ns="topology">Delete Connector?</Trans>
      </>
    ),
    messageKey,
    // t('topology~Delete')
    btnTextKey: 'topology~Delete',
    submitDanger: true,
    executeFn: () => {
      return removeTopologyResourceConnection(edge).catch((err) => {
        err && errorModal({ error: err.message });
      });
    },
  });
};
