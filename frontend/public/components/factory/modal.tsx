import { css } from '@patternfly/react-styles';
import * as Modal from 'react-modal';
import type { SyntheticEvent, FC, ReactNode, ReactElement, ComponentType } from 'react';
import { useCallback } from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button, Content, ContentVariants } from '@patternfly/react-core';
import CloseButton from '@console/shared/src/components/close-button';
import store from '../../redux';
import { ButtonBar } from '../utils/button-bar';
import { history } from '../utils/router';
import { PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { pluginStore } from '@console/internal/plugins';

/** @deprecated Use dynamic plugin sdk 'useModal' hook instead */
export const createModal: CreateModal = (getModalElement) => {
  const containerElement = document.getElementById('modal-container');
  const result = new Promise<void>((resolve) => {
    const closeModal = (e?: SyntheticEvent) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      ReactDOM.unmountComponentAtNode(containerElement);
      resolve();
    };
    // Modal app element is now set globally in App component
    containerElement && ReactDOM.render(getModalElement(closeModal), containerElement);
  });
  return { result };
};

/** @deprecated Use PF modals instead */
export const ModalWrapper: FC<ModalWrapperProps> = ({ blocking, className, children, onClose }) => {
  const { t } = useTranslation();
  const parentSelector = useCallback(() => document.querySelector('#modal-container'), []);
  const appElement = document.getElementById('app-content');
  return (
    <Modal
      appElement={appElement}
      className={css('modal-dialog', className)}
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

/** @deprecated Use dynamic plugin sdk 'useModal' hook instead */
export const createModalLauncher: CreateModalLauncher = (Component, modalWrapper = true) => ({
  blocking,
  modalClassName,
  close,
  cancel,
  ...props
}) => {
  const getModalContainer: GetModalContainer = (onClose) => {
    const handleClose = (e: SyntheticEvent) => {
      onClose?.(e);
      close?.();
    };
    const handleCancel = (e: SyntheticEvent) => {
      cancel?.();
      handleClose(e);
    };

    return (
      <Provider store={store}>
        <PluginStoreProvider store={pluginStore}>
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
        </PluginStoreProvider>
      </Provider>
    );
  };
  return createModal(getModalContainer);
};

/** @deprecated Use PF modals instead */
export const ModalTitle: FC<ModalTitleProps> = ({
  children,
  className = 'modal-header',
  close,
}) => (
  <div className={className}>
    <Content>
      <Content component={ContentVariants.h1} data-test-id="modal-title">
        {children}
        {close && (
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              close(e);
            }}
          />
        )}
      </Content>
    </Content>
  </div>
);

/** @deprecated Use PF modals instead */
export const ModalBody: FC<ModalBodyProps> = ({ children }) => (
  <div className="modal-body">
    <div className="modal-body-content">{children}</div>
  </div>
);

/** @deprecated Use PF modals instead */
export const ModalFooter: FC<ModalFooterProps> = ({
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
export const ModalSubmitFooter: FC<ModalSubmitFooterProps> = ({
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
  ariaLabel,
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
      aria-label={ariaLabel}
      variant={submitDanger ? 'danger' : 'primary'}
      isLoading={inProgress}
    >
      {submitText || t('public~Submit')}
    </Button>
  );

  const resetButton = (
    <Button variant="link" onClick={onResetClick} id="reset-action">
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
        className={css(
          { 'pf-v6-c-form__actions--right': buttonAlignment === 'right' },
          'pf-v6-c-form  pf-v6-c-form__group--no-top-margin',
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
  children?: ReactNode;
  className?: string;
  onClose?: (event?: SyntheticEvent) => void;
};

/** @deprecated Use dynamic plugin sdk 'useModal' hook instead */
export type GetModalContainer = (onClose: (e?: SyntheticEvent) => void) => ReactElement;

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
  close?: (e: SyntheticEvent<any, Event>) => void;
  children?: ReactNode;
};

export type ModalBodyProps = {
  className?: string;
  children?: ReactNode;
};

export type ModalFooterProps = {
  message?: string;
  errorMessage?: ReactNode;
  inProgress: boolean;
  className?: string;
  children?: ReactNode;
};

export type ModalSubmitFooterProps = {
  message?: string;
  errorMessage?: string;
  inProgress: boolean;
  cancel: (e: SyntheticEvent<any, Event>) => void;
  cancelText?: ReactNode;
  className?: string;
  resetText?: ReactNode;
  reset?: (e: SyntheticEvent<any, Event>) => void;
  submitText: ReactNode;
  submitDisabled?: boolean;
  submitDanger?: boolean;
  buttonAlignment?: 'left' | 'right';
  ariaLabel?: string;
};

export type CreateModalLauncher = <P extends ModalComponentProps>(
  C: ComponentType<P>,
  modalWrapper?: boolean,
) => (props: P & CreateModalLauncherProps) => { result: Promise<{}> };
