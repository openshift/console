import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

export interface HelmCreateBasicAuthSecretModalProps {
  namespace: string;
  save?: (name: string) => void;
  onClose?: () => void;
}

const HelmCreateBasicAuthSecretModal: OverlayComponent<HelmCreateBasicAuthSecretModalProps> = ({
  closeOverlay,
  namespace,
  save,
  onClose,
}) => {
  const { t } = useTranslation();
  const [secretName, setSecretName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const isCreateDisabled = !secretName.trim() || !password;

  const closeModal = () => {
    if (inProgress) {
      return;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose?.();
    closeOverlay();
  };

  const handleCreate = async () => {
    if (isCreateDisabled || inProgress) {
      return;
    }

    setInProgress(true);
    setErrorMessage(undefined);

    try {
      await k8sCreate(SecretModel, {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: secretName.trim(),
          namespace,
        },
        type: 'kubernetes.io/basic-auth',
        stringData: {
          ...(username ? { username } : {}),
          password,
        },
      });
      const createdSecretName = secretName.trim();
      closeModal();
      // Keep form update separate so a parent callback failure cannot block modal close.
      save?.(createdSecretName);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('helm-plugin~Failed to create Secret.');
      setErrorMessage(message);
    } finally {
      setInProgress(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleCreate();
  };

  return (
    <Modal
      isOpen
      onClose={closeModal}
      title={t('helm-plugin~Create authentication Secret')}
      variant={ModalVariant.medium}
    >
      <ModalHeader title={t('helm-plugin~Create authentication Secret')} />
      <ModalBody>
        <Form onSubmit={onSubmit}>
          <FormGroup label={t('public~Secret name')} isRequired fieldId="helm-secret-name">
            <TextInput
              id="helm-secret-name"
              data-test="helm-secret-name"
              type="text"
              value={secretName}
              onChange={(_event, value) => setSecretName(value)}
              isRequired
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>{t('public~Unique name of the Secret.')}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('public~Secret username')} fieldId="helm-secret-username">
            <TextInput
              id="helm-secret-username"
              data-test="helm-secret-username"
              type="text"
              value={username}
              onChange={(_event, value) => setUsername(value)}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('helm-plugin~Optional username for OCI/HTTP(S) authentication.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup
            label={t('public~Secret password or token')}
            isRequired
            fieldId="helm-secret-password"
          >
            <TextInput
              id="helm-secret-password"
              data-test="helm-secret-password"
              type="password"
              value={password}
              onChange={(_event, value) => setPassword(value)}
              isRequired
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('helm-plugin~Password or token for OCI/HTTP(S) authentication.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="button"
          variant={ButtonVariant.primary}
          isLoading={inProgress}
          isDisabled={isCreateDisabled}
          onClick={handleCreate}
        >
          {t('public~Create')}
        </Button>
        <Button variant={ButtonVariant.link} onClick={closeModal} isDisabled={inProgress}>
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </Modal>
  );
};

export type HelmCreateBasicAuthSecretModalLauncher = (
  props?: HelmCreateBasicAuthSecretModalProps,
) => void;

export const useHelmCreateBasicAuthSecretModal = (): HelmCreateBasicAuthSecretModalLauncher => {
  const launcher = useOverlay();
  return useCallback((props) => launcher(HelmCreateBasicAuthSecretModal, props), [launcher]);
};
