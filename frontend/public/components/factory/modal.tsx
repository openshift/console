import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as Modal from 'react-modal';
import { Router } from 'react-router-dom';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import store from '../../redux';
import { ButtonBar } from '../utils/button-bar';
import { history } from '../utils/router';
import { CloseButton } from '../utils/close-button';

export const createModal: CreateModal = (getModalContainer) => {
  const modalContainer = document.getElementById('modal-container');
  const result = new Promise((resolve) => {
    const closeModal = (e?: React.SyntheticEvent) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      ReactDOM.unmountComponentAtNode(modalContainer);
      resolve();
    };
    Modal.setAppElement(document.getElementById('app-container'));
    ReactDOM.render(getModalContainer(closeModal), modalContainer);
  });
  return { result };
};

export const createModalLauncher: CreateModalLauncher = (Component) => (props) => {
  const getModalContainer: GetModalContainer = (onClose) => {
    const _handleClose = (e: React.SyntheticEvent) => {
      onClose && onClose(e);
      props.close && props.close();
    };
    const _handleCancel = (e: React.SyntheticEvent) => {
      props.cancel && props.cancel();
      _handleClose(e);
    };

    return (
      <Provider store={store}>
        <Router {...{ history, basename: window.SERVER_FLAGS.basePath }}>
          <Modal
            isOpen={true}
            contentLabel="Modal"
            onRequestClose={_handleClose}
            className={classNames('modal-dialog', props.modalClassName)}
            overlayClassName="co-overlay"
            shouldCloseOnOverlayClick={!props.blocking}
            parentSelector={() => document.getElementById('modal-container')}
          >
            <Component
              {...(_.omit(props, 'blocking', 'modalClassName') as any)}
              cancel={_handleCancel}
              close={_handleClose}
            />
          </Modal>
        </Router>
      </Provider>
    );
  };
  return createModal(getModalContainer);
};

export const ModalTitle: React.SFC<ModalTitleProps> = ({
  children,
  className = 'modal-header',
  close,
}) => (
  <div className={className}>
    <h1 className="pf-c-title pf-m-2xl" data-test-id="modal-title">
      {children}
      {close && (
        <CloseButton
          onClick={(e) => {
            e.stopPropagation();
            close(e);
          }}
        />
      )}
    </h1>
  </div>
);

export const ModalBody: React.SFC<ModalBodyProps> = ({ children }) => (
  <div className="modal-body">
    <div className="modal-body-content">
      <div className="modal-body-inner-shadow-covers">{children}</div>
    </div>
  </div>
);

export const ModalFooter: React.SFC<ModalFooterProps> = ({
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

export const ModalSubmitFooter: React.SFC<ModalSubmitFooterProps> = ({
  message,
  errorMessage,
  inProgress,
  cancel,
  submitText,
  cancelText,
  submitDisabled,
  submitDanger,
  resetText = 'Reset',
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

  return (
    <ModalFooter inProgress={inProgress} errorMessage={errorMessage} message={message}>
      <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
        {reset && (
          <Button variant="link" isInline onClick={onResetClick} id="reset-action">
            {resetText}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          data-test-id="modal-cancel-action"
          onClick={onCancelClick}
        >
          {cancelText || t('public~Cancel')}
        </Button>
        {submitDanger ? (
          <Button
            type="submit"
            variant="danger"
            isDisabled={submitDisabled}
            data-test="confirm-action"
            id="confirm-action"
          >
            {submitText}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            isDisabled={submitDisabled}
            data-test="confirm-action"
            id="confirm-action"
          >
            {submitText}
          </Button>
        )}
      </ActionGroup>
    </ModalFooter>
  );
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
  errorMessage?: string;
  inProgress: boolean;
};

export type ModalSubmitFooterProps = {
  message?: string;
  errorMessage?: string;
  inProgress: boolean;
  cancel: (e: React.SyntheticEvent<any, Event>) => void;
  cancelText?: React.ReactNode;
  resetText?: React.ReactNode;
  reset?: (e: React.SyntheticEvent<any, Event>) => void;
  submitText: React.ReactNode;
  submitDisabled?: boolean;
  submitDanger?: boolean;
};

export type CreateModalLauncher = <P extends ModalComponentProps>(
  C: React.ComponentType<P>,
) => (props: P & CreateModalLauncherProps) => { result: Promise<{}> };
