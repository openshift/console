import * as React from 'react';
import classNames from 'classnames';
import { Alert, Button, ButtonVariant, AlertProps } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import { prefixedID } from '../../../utils';

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
  id,
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
    className={classNames(
      'co-m-btn-bar modal-footer kubevirt-create-nic-modal__buttons',
      className,
    )}
  >
    {warningMessage && isSimpleError && (
      <ModalSimpleMessage message={warningMessage} variant="warning" />
    )}
    {errorMessage && isSimpleError && <ModalSimpleMessage message={errorMessage} />}
    {errorMessage && !isSimpleError && <ModalErrorMessage message={errorMessage} />}
    {infoTitle && <ModalInfoMessage title={infoTitle}>{infoMessage}</ModalInfoMessage>}
    <Button
      variant={ButtonVariant.primary}
      onClick={onSubmit}
      id={prefixedID(id, 'submit')}
      isDisabled={isDisabled}
    >
      {submitButtonText}
    </Button>
    <Button variant={ButtonVariant.link} onClick={onCancel} id={prefixedID(id, 'cancel')}>
      {cancelButtonText}
    </Button>
    {inProgress && <LoadingInline />}
  </footer>
);
