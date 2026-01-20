import type { FC } from 'react';
import { useState } from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  ModalBody,
  ModalSubmitFooter,
  ModalTitle,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { VolumeAttributesClassDropdown } from '@console/internal/components/utils/volume-attributes-class-dropdown';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

const ModifyVACModalComponent: FC<ModifyVACModalComponentProps> = ({ resource, close, cancel }) => {
  const { t } = useTranslation();
  const [volumeAttributesClass, setVolumeAttributesClass] = useState(
    resource?.spec?.volumeAttributesClassName || '',
  );
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

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
    <Form onSubmit={handleSubmit}>
      <ModalTitle>{t('console-app~Modify VolumeAttributesClass')}</ModalTitle>
      <ModalBody>
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
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('console-app~Save')}
        submitDisabled={!volumeAttributesClass}
        cancel={cancel}
        inProgress={inProgress}
        errorMessage={errorMessage}
      />
    </Form>
  );
};

export const ModifyVACModal: FC<ModifyVACModalProps> = ({ closeOverlay, resource }) => {
  return (
    <ModalWrapper blocking onClose={closeOverlay}>
      <ModifyVACModalComponent close={closeOverlay} cancel={closeOverlay} resource={resource} />
    </ModalWrapper>
  );
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
