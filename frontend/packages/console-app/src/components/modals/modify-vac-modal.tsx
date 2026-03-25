import type { FC } from 'react';
import { useState } from 'react';
import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { VolumeAttributesClassDropdown } from '@console/internal/components/utils/volume-attributes-class-dropdown';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';

const ModifyVACModalComponent: FC<ModifyVACModalComponentProps> = ({ resource, close, cancel }) => {
  const { t } = useTranslation();
  const [volumeAttributesClass, setVolumeAttributesClass] = useState(
    resource?.spec?.volumeAttributesClassName || '',
  );
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (): void => {
    const hasExistingVAC = !!resource?.spec?.volumeAttributesClassName;

    const patch = [
      {
        op: hasExistingVAC ? 'replace' : 'add',
        path: '/spec/volumeAttributesClassName',
        value: volumeAttributesClass,
      },
    ];

    handlePromise(
      k8sPatchResource({
        model: PersistentVolumeClaimModel,
        resource,
        data: patch,
      }),
    )
      .then(() => close())
      .catch(() => {});
  };

  return (
    <>
      <ModalHeader
        title={t('console-app~Modify VolumeAttributesClass')}
        labelId="modify-vac-modal-title"
      />
      <ModalBody>
        <Form
          id="modify-vac-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <FormGroup fieldId="vac-dropdown">
            <VolumeAttributesClassDropdown
              onChange={setVolumeAttributesClass}
              selectedKey={volumeAttributesClass}
              id="vac-dropdown"
              dataTest="modify-vac-dropdown"
              required
              noSelection
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="modify-vac-form"
          isLoading={inProgress}
          isDisabled={!volumeAttributesClass || inProgress}
        >
          {t('console-app~Save')}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const ModifyVACModal: FC<ModifyVACModalProps> = ({ closeOverlay, resource }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="modify-vac-modal-title"
    >
      <ModifyVACModalComponent close={handleClose} cancel={handleClose} resource={resource} />
    </Modal>
  ) : null;
};

export type ModifyVACModalProps = {
  resource: PersistentVolumeClaimKind;
  closeOverlay: () => void;
};

type ModifyVACModalComponentProps = {
  resource: PersistentVolumeClaimKind;
  close: () => void;
  cancel: () => void;
};
