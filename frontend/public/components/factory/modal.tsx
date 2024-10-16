import * as classNames from 'classnames';
import * as React from 'react';
import { Provider } from 'react-redux';
import * as ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import {
  ActionGroup,
  Button,
  ModalVariant,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import CloseButton from '@console/shared/src/components/close-button';
import { Modal } from '@console/shared/src/components/modal';
import store from '../../redux';
import { ButtonBar } from '../utils/button-bar';
import { history } from '../utils/router';

/** @deprecated Use dynamic plugin sdk 'useModal' hook instead */
export const createModal: CreateModal = (getModalElement) => {
  const appContentElement = document.getElementById('app-content');
  const containerElement = document.getElementById('modal-container');
  const result = new Promise<void>((resolve) => {
    const closeModal = (e?: React.SyntheticEvent) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      appContentElement.removeAttribute('aria-hidden');
      ReactDOM.unmountComponentAtNode(containerElement);
      resolve();
    };
    appContentElement.setAttribute('aria-hidden', 'true');
    containerElement && ReactDOM.render(getModalElement(closeModal), containerElement);
  });
  return { result };
};

/** @deprecated Use PF modals instead */
export const ModalWrapper: React.FC<ModalWrapperProps> = ({ className, children, onClose }) => {
  return (
    <Modal
      className={classNames('modal-dialog', className)}
      isOpen
      variant={ModalVariant.small}
      aria-labelledby="modal-title"
      onClose={onClose}
    >
      {children}
    </Modal>
  );
};

/** @deprecated Use dynamic plugin sdk 'useModal' hook instead */
export const createModalLauncher: CreateModalLauncher = (Component) => ({
  modalClassName,
  close,
  cancel,
  ...props
}) => {
  const getModalContainer = (onClose) => {
    const handleClose = () => {
      onClose?.();
      close?.();
    };
    const handleCancel = () => {
      cancel?.();
      handleClose();
    };

    return (
      <Provider store={store}>
        <Router {...{ history, basename: window.SERVER_FLAGS.basePath }}>
          <CompatRouter>
            <ModalWrapper onClose={handleClose} className={modalClassName}>
              <Component {...(props as any)} cancel={handleCancel} close={handleClose} />
            </ModalWrapper>
          </CompatRouter>
        </Router>
      </Provider>
    );
  };

  return createModal(getModalContainer);
};

/** @deprecated Use PF modals instead */
export const ModalTitle: React.FC<ModalTitleProps> = ({
  children,
  className = 'modal-header',
  close,
}) => (
  <div className={className}>
    <TextContent>
      <Text component={TextVariants.h1} data-test-id="modal-title" id="modal-title">
        {children}
        {close && (
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              close(e);
            }}
          />
        )}
      </Text>
    </TextContent>
  </div>
);

/** @deprecated Use PF modals instead */
export const ModalBody: React.FC<ModalBodyProps> = ({ children }) => (
  <div className="modal-body">
    <div className="modal-body-content">{children}</div>
  </div>
);

/** @deprecated Use PF modals instead */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  message,
  errorMessage,
  inProgress,
  children,
}) => {
  return (
    <ButtonBar
      className="modal-footer"
      errorMessage={errorMessage}
      infoMessage={message}
      inProgress={inProgress}
    >
      {children}
    </ButtonBar>
  );
};

/** @deprecated Use PF modals instead */
export const ModalSubmitFooter: React.FC<ModalSubmitFooterProps> = ({
  message,
  errorMessage,
  inProgress,
  cancel,
  submitText,
  cancelText,
  className,
  submitDisabled,
  submitDanger,
  buttonAlignment = 'right',
  resetText,
  reset,
}) => {
  const { t } = useTranslation();
  const onCancelClick = (e) => {
    e.stopPropagation();
    cancel(e);
  };

  const onResetClick = (e) => {
    e.stopPropagation();
    reset(e);
  };

  const cancelButton = (
    <Button
      type="button"
      variant="secondary"
      data-test-id="modal-cancel-action"
      onClick={onCancelClick}
      aria-label={t('public~Cancel')}
    >
      {cancelText || t('public~Cancel')}
    </Button>
  );

  const submitButton = (
    <Button
      data-test="confirm-action"
      id="confirm-action"
      isDisabled={submitDisabled}
      type="submit"
      variant={submitDanger ? 'danger' : 'primary'}
      isLoading={inProgress}
    >
      {submitText || t('public~Submit')}
    </Button>
  );

  const resetButton = (
    <Button variant="link" isInline onClick={onResetClick} id="reset-action">
      {resetText || t('public~Reset')}
    </Button>
  );

  return (
    <ModalFooter
      inProgress={false}
      errorMessage={errorMessage}
      message={message}
      className={className}
    >
      <ActionGroup
        className={classNames(
          { 'pf-v5-c-form__actions--right': buttonAlignment === 'right' },
          'pf-v5-c-form  pf-v5-c-form__group--no-top-margin',
        )}
      >
        {buttonAlignment === 'left' ? (
          <>
            {submitButton}
            {reset && resetButton}
            {cancelButton}
          </>
        ) : (
          <>
            {reset && resetButton}
            {cancelButton}
            {submitButton}
          </>
        )}
      </ActionGroup>
    </ModalFooter>
  );
};

export type ModalWrapperProps = {
  className?: string;
  onClose?: (event?: KeyboardEvent | React.MouseEvent) => void;
};

/** @deprecated Use dynamic plugin sdk 'useModal' hook instead */
export type GetModalContainer = (onClose: (e?: React.SyntheticEvent) => void) => React.ReactElement;

type CreateModal = (getModalContainer: GetModalContainer) => { result: Promise<any> };

export type CreateModalLauncherProps = {
  modalClassName?: string;
};

export type ModalComponentProps = {
  cancel?: () => void;
  close?: () => void;
};

export type ModalTitleProps = {
  className?: string;
  close?: (e: KeyboardEvent | React.MouseEvent) => void;
};

export type ModalBodyProps = {
  className?: string;
};

export type ModalFooterProps = {
  message?: string;
  errorMessage?: React.ReactNode;
  inProgress: boolean;
  className?: string;
};

export type ModalSubmitFooterProps = {
  message?: string;
  errorMessage?: string;
  inProgress: boolean;
  cancel: (e: React.SyntheticEvent<any, Event>) => void;
  cancelText?: React.ReactNode;
  className?: string;
  resetText?: React.ReactNode;
  reset?: (e: React.SyntheticEvent<any, Event>) => void;
  submitText: React.ReactNode;
  submitDisabled?: boolean;
  submitDanger?: boolean;
  buttonAlignment?: 'left' | 'right';
};

export type CreateModalLauncher = <P extends ModalComponentProps>(
  C: React.ComponentType<P>,
  modalWrapper?: boolean,
) => (props: P & CreateModalLauncherProps) => { result: Promise<{}> };
