import * as React from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { VolumeAttributesClassDropdown } from '@console/internal/components/utils/volume-attributes-class-dropdown';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { k8sPatch, PersistentVolumeClaimKind } from '@console/internal/module/k8s';

type ModifyVACModalProps = {
  resource: PersistentVolumeClaimKind;
} & ModalComponentProps;

const ModifyVACModal: React.FCC<ModifyVACModalProps> = ({ resource, close, cancel }) => {
  const { t } = useTranslation();
  const [volumeAttributesClass, setVolumeAttributesClass] = React.useState(
    resource?.spec?.volumeAttributesClassName || '',
  );
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const submit = (event) => {
    event.preventDefault();
    setInProgress(true);

    const patch = [
      {
        op: volumeAttributesClass ? 'replace' : 'remove',
        path: '/spec/volumeAttributesClassName',
        value: volumeAttributesClass || undefined,
      },
    ];

    k8sPatch(PersistentVolumeClaimModel, resource, patch)
      .then(() => {
        setInProgress(false);
        close();
      })
      .catch((err) => {
        setErrorMessage(err.message || 'An error occurred');
        setInProgress(false);
      });
  };

  return (
    <Form onSubmit={submit}>
      <ModalTitle>{t('console-app~Modify VolumeAttributesClass')}</ModalTitle>
      <ModalBody>
        <p>
          {t(
            'console-app~Modify the VolumeAttributesClass for this PersistentVolumeClaim. This can only be changed for bound PVCs.',
          )}
        </p>
        <FormGroup fieldId="vac-dropdown">
          <VolumeAttributesClassDropdown
            onChange={setVolumeAttributesClass}
            selectedKey={volumeAttributesClass}
            id="vac-dropdown"
            dataTest="modify-vac-dropdown"
            required={false}
          />
        </FormGroup>
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('console-app~Save')}
        cancel={cancel}
        inProgress={inProgress}
        errorMessage={errorMessage}
      />
    </Form>
  );
};

export const modifyVACModal = createModalLauncher(ModifyVACModal);
