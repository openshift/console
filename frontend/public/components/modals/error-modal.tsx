import { useCallback } from 'react';
import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps } from '@console/shared/src/types/modal';

export const ErrorModal: OverlayComponent<ErrorModalProps> = (props) => {
  const { t } = useTranslation();
  const { error, title } = props;
  const titleText = title || t('public~Error');
  return (
    <Modal
      isOpen
      onClose={props.closeOverlay}
      variant={ModalVariant.small}
      aria-labelledby="title-icon-modal-title"
    >
      <ModalHeader title={titleText} titleIconVariant="warning" labelId="title-icon-modal-title" />
      <ModalBody>{error}</ModalBody>
      <ModalFooter>
        <Button key="cancel" variant={ButtonVariant.primary} onClick={props.closeOverlay}>
          {t('public~OK')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const useErrorModalLauncher = (
  props?: Partial<ErrorModalProps>,
): ((overrides?: ErrorModalProps) => void) => {
  const launcher = useOverlay();
  return useCallback(
    (overrides?: ErrorModalProps) => {
      const mergedProps: ErrorModalProps = {
        error: '',
        ...(props || {}),
        ...(overrides || {}),
      };
      launcher<ErrorModalProps>(ErrorModal, mergedProps);
    },
    [launcher, props],
  );
};

export type ErrorModalProps = {
  error: string | React.ReactNode;
  title?: string;
} & ModalComponentProps;
