import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as Modal from 'react-modal';
import * as PropTypes from 'prop-types';
import { Router } from 'react-router-dom';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

import store from '../../redux';
import { ButtonBar } from '../utils/button-bar';
import { history } from '../utils/router';

export const createModalLauncher: CreateModalLauncher = (Component) => (props) => {
  const modalContainer = document.getElementById('modal-container');

  const result = new Promise(resolve => {
    const closeModal = e => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      ReactDOM.unmountComponentAtNode(modalContainer);
      resolve();
    };
    Modal.setAppElement(modalContainer);
    ReactDOM.render(<Provider store={store}>
      <Router {...{history, basename: window.SERVER_FLAGS.basePath}}>
        <Modal
          isOpen={true}
          contentLabel="Modal"
          onRequestClose={closeModal}
          className={classNames('modal-dialog', props.modalClassName)}
          overlayClassName="co-overlay"
          shouldCloseOnOverlayClick={!props.blocking}>
          <Component {..._.omit(props, 'blocking', 'modalClassName') as any} cancel={closeModal} close={closeModal} />
        </Modal>
      </Router>
    </Provider>, modalContainer);
  });
  return {result};
};

export const ModalTitle: React.SFC<ModalTitleProps> = ({children, className = 'modal-header'}) => <div className={className}><h4 className="modal-title">{children}</h4></div>;

export const ModalBody: React.SFC<ModalBodyProps> = ({children, className= 'modal-body'}) => (
  <div className={className}>
    <div className="modal-body-content">
      <div className="modal-body-inner-shadow-covers">{children}</div>
    </div>
  </div>
);


export const ModalFooter: React.SFC<ModalFooterProps> = ({message, errorMessage, inProgress, children}) => {
  return <ButtonBar className="modal-footer" errorMessage={errorMessage} infoMessage={message} inProgress={inProgress}>
    {children}
  </ButtonBar>;
};

export const ModalSubmitFooter: React.SFC<ModalSubmitFooterProps> = ({message, errorMessage, inProgress, cancel, submitText, submitDisabled, submitButtonClass='btn-primary'}) => {
  const onCancelClick = e => {
    e.stopPropagation();
    cancel(e);
  };

  return <ModalFooter inProgress={inProgress} errorMessage={errorMessage} message={message}>
    <button type="button" onClick={onCancelClick} className="btn btn-default">Cancel</button>
    <button type="submit" className={classNames('btn', submitButtonClass)} disabled={submitDisabled} id="confirm-action">{submitText}</button>
  </ModalFooter>;
};

ModalSubmitFooter.propTypes = {
  cancel: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired,
  inProgress: PropTypes.bool.isRequired,
  message: PropTypes.string,
  submitText: PropTypes.node.isRequired,
  submitButtonClass: PropTypes.string,
  submitDisabled: PropTypes.bool,
};

export type CreateModalLauncherProps = {
  blocking?: boolean;
  modalClassName?: string;
};

export type ModalComponentProps = {
  cancel: (e?: Event) => void;
  close: (e?: Event) => void;
};

export type ModalTitleProps = {
  className?: string;
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
  cancel: (e: Event) => void;
  submitText: React.ReactNode;
  submitDisabled?: boolean;
  submitButtonClass?: string;
};

export type CreateModalLauncher = <P extends ModalComponentProps>(C: React.ComponentType<P>) =>
  (props: Omit<P, keyof ModalComponentProps> & CreateModalLauncherProps) => {result: Promise<{}>};
