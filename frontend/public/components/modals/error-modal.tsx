import { useCallback } from 'react';
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Modal,
  ModalHeader,
  ModalVariant,
  ModalBody as PfModalBody,
  ModalFooter as PfModalFooter,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalTitle, ModalBody, ModalFooter, ModalComponentProps } from '../factory/modal';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';

export const ModalErrorContent = (props: ErrorModalProps) => {
  const { t } = useTranslation();
  const { error, title, cancel } = props;
  const titleText = title || t('public~Error');
  return (
    <div className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {titleText}
      </ModalTitle>
      <ModalBody>{error}</ModalBody>
      <ModalFooter inProgress={false} errorMessage="">
        <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--right pf-v6-c-form__group--no-top-margin">
          <Button type="button" variant="primary" onClick={cancel}>
            {t('public~OK')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </div>
  );
};

export const ErrorModal: OverlayComponent<ErrorModalProps> = (props) => {
  const { t } = useTranslation();
  const { error, title } = props;
  const titleText = title || t('public~Error');
  return (
    <Modal isOpen onClose={props.closeOverlay} variant={ModalVariant.small}>
      <ModalHeader title={titleText} titleIconVariant="warning" labelId="title-icon-modal-title" />
      <PfModalBody>{error}</PfModalBody>
      <PfModalFooter>
        <Button key="cancel" variant={ButtonVariant.primary} onClick={props.closeOverlay}>
          {t('public~OK')}
        </Button>
      </PfModalFooter>
    </Modal>
  );
};

export const useErrorModalLauncher = (props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<ErrorModalProps>(ErrorModal, props), [launcher, props]);
};

export type ErrorModalProps = {
  error: string | React.ReactNode;
  title?: string;
} & ModalComponentProps;
