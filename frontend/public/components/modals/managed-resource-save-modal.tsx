import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
  ModalWrapper,
} from '../factory/modal';
import { referenceForOwnerRef, K8sResourceCommon, OwnerReference } from '../../module/k8s/';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';

import { ResourceLink } from '../utils/resource-link';

const ManagedResourceSaveModal: FC<ManagedResourceSaveModalProps> = (props) => {
  const submit = (event) => {
    event.preventDefault();
    props.onSubmit();
    props.close();
  };

  const { owner, resource } = props;
  const { t } = useTranslation();
  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {t('public~Managed resource')}
      </ModalTitle>
      <ModalBody className="modal-body">
        <Trans t={t} ns="public">
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
      <ModalSubmitFooter submitText={t('public~Save')} cancel={props.close} inProgress={false} />
    </form>
  );
};

export const ManagedResourceSaveModalOverlay: OverlayComponent<ManagedResourceSaveModalProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <ManagedResourceSaveModal {...props} close={props.closeOverlay} />
    </ModalWrapper>
  );
};

type ManagedResourceSaveModalProps = {
  onSubmit: () => void;
  resource: K8sResourceCommon;
  owner: OwnerReference;
} & ModalComponentProps;
