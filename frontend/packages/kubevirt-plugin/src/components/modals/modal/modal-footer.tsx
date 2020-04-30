import * as React from 'react';
import classNames from 'classnames';
import { Alert, Button, AlertProps, ActionGroup } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';

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
  isDisabled?: boolean;
  inProgress?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  infoTitle?: string;
  infoMessage?: React.ReactNode;
};

export const ModalFooter: React.FC<ModalFooterProps> = ({
  className = '',
  errorMessage = null,
  warningMessage = null,
  isDisabled = false,
  inProgress = false,
  isSimpleError = false,
  onSubmit,
  onCancel,
  submitButtonText = 'Add',
  cancelButtonText = 'Cancel',
  infoMessage = null,
  infoTitle = null,
}) => (
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
        variant="secondary"
        data-test-id="modal-cancel-action"
        onClick={onCancel}
      >
        {cancelButtonText}
      </Button>
      <Button variant="primary" isDisabled={isDisabled} id="confirm-action" onClick={onSubmit}>
        {submitButtonText}
      </Button>
    </ActionGroup>

    {inProgress && <LoadingInline />}
  </footer>
);
