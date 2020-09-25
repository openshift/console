import * as React from 'react';
import classNames from 'classnames';
import {
  Alert,
  Button,
  ButtonVariant,
  AlertProps,
  ActionGroup,
  Spinner,
} from '@patternfly/react-core';

import './modal-footer.scss';

type ModalErrorMessageProps = {
  message: string;
};

export const ModalErrorMessage: React.FC<ModalErrorMessageProps> = ({ message }) => (
  <Alert
    isInline
    className="co-alert co-alert--scrollable"
    variant="danger"
    title="An error occurred"
  >
    <div className="co-pre-line">{message}</div>
  </Alert>
);

type ModalSimpleMessageProps = {
  message: string;
  variant?: AlertProps['variant'];
};

export const ModalSimpleMessage: React.FC<ModalSimpleMessageProps> = ({
  message,
  variant = 'danger',
}) => <Alert isInline className="co-alert" variant={variant} title={message} />;

type ModalInfoMessageProps = {
  title: string;
  children: React.ReactNode;
};

export const ModalInfoMessage: React.FC<ModalInfoMessageProps> = ({ title, children }) => (
  <Alert isInline className="co-alert co-alert--scrollable" variant="info" title={title}>
    {children}
  </Alert>
);

type ModalFooterProps = {
  id?: string;
  className?: string;
  errorMessage?: string;
  warningMessage?: string;
  isSimpleError?: boolean;
  onSubmit: (e) => void;
  onCancel: (e) => void;
  onSaveAndRestart?: (e) => void;
  isDisabled?: boolean;
  inProgress?: boolean;
  isSaveAndRestart?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  saveAndRestartText?: string;
  infoTitle?: string;
  infoMessage?: React.ReactNode;
};

export const ModalFooter: React.FC<ModalFooterProps> = ({
  className = '',
  errorMessage = null,
  warningMessage = null,
  isDisabled = false,
  inProgress = false,
  isSaveAndRestart = false,
  isSimpleError = false,
  onSubmit,
  onCancel,
  onSaveAndRestart,
  submitButtonText = 'Add',
  cancelButtonText = 'Cancel',
  saveAndRestartText = 'Save and Restart',
  infoMessage = null,
  infoTitle = null,
}) => {
  const [showSpinner, setShowSpinner] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => setShowSpinner(true), 300);
  }, []);

  return (
    <footer
      className={classNames('co-m-btn-bar modal-footer kubevirt-modal-footer__buttons', className)}
    >
      {warningMessage && isSimpleError && (
        <ModalSimpleMessage message={warningMessage} variant="warning" />
      )}
      {errorMessage && isSimpleError && <ModalSimpleMessage message={errorMessage} />}
      {errorMessage && !isSimpleError && <ModalErrorMessage message={errorMessage} />}
      {infoTitle && <ModalInfoMessage title={infoTitle}>{infoMessage}</ModalInfoMessage>}

      <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
        <Button
          type="button"
          variant={ButtonVariant.secondary}
          data-test-id="modal-cancel-action"
          onClick={onCancel}
        >
          {cancelButtonText}
        </Button>
        {isSaveAndRestart && (
          <Button
            type="button"
            variant={ButtonVariant.secondary}
            id="save-and-restart"
            onClick={onSaveAndRestart}
          >
            {saveAndRestartText}
          </Button>
        )}
        <Button
          variant={ButtonVariant.primary}
          isDisabled={isDisabled}
          id="confirm-action"
          onClick={onSubmit}
        >
          {inProgress && showSpinner && <Spinner id="modal-footer-spinner" size="md" />}
          {submitButtonText}
        </Button>
      </ActionGroup>
    </footer>
  );
};
