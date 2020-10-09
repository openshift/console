import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { referenceForOwnerRef, K8sResourceCommon, OwnerReference } from '../../module/k8s/';
import { YellowExclamationTriangleIcon } from '@console/shared';

import { ResourceLink } from '../utils/resource-link';

const ManagedResourceSaveModal: React.SFC<ManagedResourceSaveModalProps> = (props) => {
  const submit = (event) => {
    event.preventDefault();
    props.onSubmit();
    props.close();
  };

  const { owner, resource } = props;
  const { t } = useTranslation();
  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {t('modal~Managed resource')}
      </ModalTitle>
      <ModalBody className="modal-body">
        <Trans t={t} ns="modal">
          This resource is managed by{' '}
          <ResourceLink
            className="modal__inline-resource-link"
            inline
            kind={referenceForOwnerRef(owner)}
            name={owner.name}
            namespace={resource.metadata.namespace}
          />{' '}
          and any modifications may be overwritten. Edit the managing resource to preserve changes.
        </Trans>
      </ModalBody>
      <ModalSubmitFooter submitText={t('modal~Save')} cancel={props.close} inProgress={false} />
    </form>
  );
};

export const managedResourceSaveModal = createModalLauncher(ManagedResourceSaveModal);

type ManagedResourceSaveModalProps = {
  onSubmit: () => void;
  close: () => void;
  resource: K8sResourceCommon;
  owner: OwnerReference;
};
