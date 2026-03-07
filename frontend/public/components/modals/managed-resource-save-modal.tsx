import type { FC } from 'react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { referenceForOwnerRef, K8sResourceCommon, OwnerReference } from '../../module/k8s/';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalComponentProps } from '../factory/modal';
import { ResourceLink } from '../utils/resource-link';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

const ManagedResourceSaveModal: FC<ManagedResourceSaveModalProps> = (props) => {
  const submit = (event) => {
    event.preventDefault();
    props.onSubmit();
    props.close();
  };

  const { owner, resource } = props;
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader title={t('public~Managed resource')} titleIconVariant="warning" />
      <ModalBody>
        <Form id="managed-resource-save-form" onSubmit={submit}>
          <Content component={ContentVariants.p}>
            <Trans t={t} ns="public">
              This resource is managed by{' '}
              <ResourceLink
                className="modal__inline-resource-link"
                inline
                kind={referenceForOwnerRef(owner)}
                name={owner.name}
                namespace={resource.metadata.namespace}
              />{' '}
              and any modifications may be overwritten. Edit the managing resource to preserve
              changes.
            </Trans>
          </Content>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts>
        <Button
          type="submit"
          variant="primary"
          data-test="confirm-action"
          form="managed-resource-save-form"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={props.close} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const ManagedResourceSaveModalOverlay: OverlayComponent<ManagedResourceSaveModalProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <ManagedResourceSaveModal {...props} close={handleClose} />
    </Modal>
  ) : null;
};

type ManagedResourceSaveModalProps = {
  onSubmit: () => void;
  resource: K8sResourceCommon;
  owner: OwnerReference;
} & ModalComponentProps;
