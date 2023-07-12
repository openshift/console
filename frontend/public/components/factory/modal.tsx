import * as classNames from 'classnames';
import * as Modal from 'react-modal';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button, Text, TextContent, TextVariants } from '@patternfly/react-core';
import CloseButton from '@console/shared/src/components/close-button';
import store from '../../redux';
import { ButtonBar } from '../utils/button-bar';
import { history } from '../utils/router';

export const createModal: CreateModal = (getModalElement) => {
  const containerElement = document.getElementById('modal-container');
  const result = new Promise<void>((resolve) => {
    const closeModal = (e?: React.SyntheticEvent) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      ReactDOM.unmountComponentAtNode(containerElement);
      resolve();
    };
    Modal.setAppElement(document.getElementById('app-content'));
    containerElement && ReactDOM.render(getModalElement(closeModal), containerElement);
  });
  return { result };
};

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  blocking,
  className,
  children,
  onClose,
}) => {
  const { t } = useTranslation();
  const parentSelector = React.useCallback(() => document.querySelector('#modal-container'), []);
  return (
    <Modal
      className={classNames('modal-dialog', className)}
      contentLabel={t('public~Modal')}
      isOpen
      onRequestClose={onClose}
      overlayClassName="co-overlay"
      parentSelector={parentSelector}
      shouldCloseOnOverlayClick={!blocking}
    >
      {children}
    </Modal>
  );
};

export const createModalLauncher: CreateModalLauncher = (Component, modalWrapper = true) => ({
  blocking,
  modalClassName,
  close,
  cancel,
  ...props
}) => {
  const getModalContainer: GetModalContainer = (onClose) => {
    const handleClose = (e: React.SyntheticEvent) => {
      onClose?.(e);
      close?.();
    };
    const handleCancel = (e: React.SyntheticEvent) => {
      cancel?.();
      handleClose(e);
    };

    return (
      <Provider store={store}>
        <Router {...{ history, basename: window.SERVER_FLAGS.basePath }}>
          <CompatRouter>
            {modalWrapper ? (
              <ModalWrapper blocking={blocking} className={modalClassName} onClose={handleClose}>
                <Component {...(props as any)} cancel={handleCancel} close={handleClose} />
              </ModalWrapper>
            ) : (
              <Component {...(props as any)} cancel={handleCancel} close={handleClose} />
            )}
          </CompatRouter>
        </Router>
      </Provider>
    );
  };
  return createModal(getModalContainer);
};

export const ModalTitle: React.FC<ModalTitleProps> = ({
  children,
  className = 'modal-header',
  close,
}) => (
  <div className={className}>
    <TextContent>
      <Text component={TextVariants.h1} data-test-id="modal-title">
        {children}
        {close && (
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              close(e);
            }}
            additionalClassName="co-close-button--float-right"
          />
        )}
      </Text>
    </TextContent>
  </div>
);

export const ModalBody: React.FC<ModalBodyProps> = ({ children }) => (
  <div className="modal-body">
    <div className="modal-body-content">{children}</div>
  </div>
);

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
      inProgress={inProgress}
      errorMessage={errorMessage}
      message={message}
      className={className}
    >
      <ActionGroup
        className={classNames(
          { 'pf-c-form__actions--right': buttonAlignment === 'right' },
          'pf-c-form  pf-c-form__group--no-top-margin',
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
  blocking?: boolean;
  className?: string;
  onClose?: (event?: React.SyntheticEvent) => void;
};

export type GetModalContainer = (onClose: (e?: React.SyntheticEvent) => void) => React.ReactElement;

type CreateModal = (getModalContainer: GetModalContainer) => { result: Promise<any> };

export type CreateModalLauncherProps = {
  blocking?: boolean;
  modalClassName?: string;
};

export type ModalComponentProps = {
  cancel?: () => void;
  close?: () => void;
};

export type ModalTitleProps = {
  className?: string;
  close?: (e: React.SyntheticEvent<any, Event>) => void;
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
