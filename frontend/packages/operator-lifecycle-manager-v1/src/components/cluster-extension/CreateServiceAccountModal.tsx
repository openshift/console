import { useState } from 'react';
import {
  Button,
  Alert,
  Form,
  FormGroup,
  TextInput,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { ServiceAccountModel } from '@console/internal/models';

export interface CreateServiceAccountModalProps {
  namespace: string;
  onSubmit?: (serviceAccount: K8sResourceCommon) => void;
  initialName?: string;
}

export const CreateServiceAccountModal: OverlayComponent<CreateServiceAccountModalProps> = ({
  closeOverlay,
  onSubmit,
  namespace,
  initialName = '',
}) => {
  const { t } = useTranslation();

  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState(initialName);

  const thenPromise = (res) => {
    setInProgress(false);
    setErrorMessage('');
    return res;
  };

  const catchError = (error) => {
    const err = error.message || t('olm-v1~An error occurred. Please try again.');
    setInProgress(false);
    setErrorMessage(err);
    return Promise.reject(err);
  };

  const handlePromise = (promise) => {
    setInProgress(true);

    return promise.then(
      (res) => thenPromise(res),
      (error) => catchError(error),
    );
  };

  const createServiceAccount = () => {
    const serviceAccount = {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name,
        namespace,
      },
    };
    return k8sCreateResource({ model: ServiceAccountModel, data: serviceAccount });
  };

  const submit = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    handlePromise(createServiceAccount())
      .then((obj) => {
        closeOverlay();
        if (onSubmit) {
          onSubmit(obj);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Failed to create ServiceAccount:`, err);
      });
  };

  return (
    <Modal variant="small" isOpen onClose={closeOverlay}>
      <ModalHeader title={t('olm-v1~Create ServiceAccount')} />
      <ModalBody>
        <Form onSubmit={submit}>
          <FormGroup label={t('olm-v1~Name')} fieldId="input-name">
            <TextInput
              id="input-name"
              data-test="input-name"
              name="name"
              type="text"
              value={name}
              onChange={(e, value) => setName(value)}
            />
          </FormGroup>
          <FormGroup label={t('olm-v1~Namespace')} fieldId="input-namespace">
            <TextInput
              readOnly
              id="input-namespace"
              data-test="input-namespace"
              name="namespace"
              value={namespace}
              type="text"
            />
          </FormGroup>
          {errorMessage && (
            <Alert
              isInline
              className="co-alert co-alert--scrollable"
              variant="danger"
              title={t('olm-v1~An error occurred')}
              data-test="alert-error"
            >
              <div className="co-pre-line">{errorMessage}</div>
            </Alert>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="confirm-action"
          type="submit"
          variant="primary"
          disabled={inProgress || !name}
          onClick={submit}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('olm-v1~Create')}
        </Button>
        <Button
          key="cancel-action"
          type="button"
          variant="secondary"
          disabled={inProgress}
          onClick={closeOverlay}
          data-test-id="modal-cancel-action"
        >
          {t('olm-v1~Cancel')}
        </Button>
        {inProgress && <LoadingInline />}
      </ModalFooter>
    </Modal>
  );
};
