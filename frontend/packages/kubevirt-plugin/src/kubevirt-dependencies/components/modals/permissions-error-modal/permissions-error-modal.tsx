import * as React from 'react';
import { Alert, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
  ModalTitle,
} from '@console/internal/components/factory';

type PermissionsErrorModalProps = {
  title: string;
  errorMsg: string;
} & ModalComponentProps;

const PermissionsErrorModal: React.FC<PermissionsErrorModalProps> = ({
  title,
  errorMsg,
  close,
}) => {
  const { t } = useTranslation();
  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{title}</ModalTitle>
      <ModalBody>
        <Alert variant="danger" isInline title={t('kubevirt-plugin~Permissions required')}>
          {errorMsg}
        </Alert>
      </ModalBody>
      <ModalFooter inProgress={false}>
        <Button type="button" data-test-id="modal-close-action" onClick={close}>
          {t('kubevirt-plugin~Close')}
        </Button>
      </ModalFooter>
    </div>
  );
};

export const permissionsErrorModal = createModalLauncher(PermissionsErrorModal);
