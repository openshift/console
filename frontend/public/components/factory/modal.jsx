import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Modal from 'react-modal';
import * as PropTypes from 'prop-types';

import { ButtonBar } from '../utils';

export const createModalLauncher = (Component) => (props = {}) => {
  const modalContainer = document.getElementById('modal-container');

  const result = new Promise(resolve => {
    const closeModal = e => {
      // Disable closing the modal with the escape key for "blocking" modals
      if (props.blocking && _.get(e, 'type') === 'keydown') {
        return;
      }
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      ReactDOM.unmountComponentAtNode(modalContainer);
      resolve();
    };

    ReactDOM.render(<Modal
      isOpen={true}
      contentLabel="Modal"
      onRequestClose={closeModal}
      className="modal-content"
      overlayClassName="co-overlay"
      shouldCloseOnOverlayClick={!props.blocking}>
      <Component {...props} cancel={closeModal} close={closeModal} />
    </Modal>, modalContainer);
  });
  return {result};
};

export const ModalTitle = ({children}) => <div className="modal-header"><h4 className="modal-title">{children}</h4></div>;

export const ModalBody = ({children}) => <div className="modal-body">{children}</div>;

export const ModalFooter = ({message, errorMessage, inProgress, children}) => {
  return <ButtonBar className="modal-footer" errorMessage={errorMessage} infoMessage={message} inProgress={inProgress}>
    {children}
  </ButtonBar>;
};

export const ModalSubmitFooter = ({message, errorMessage, inProgress, cancel, submitText, submitDisabled}) => {
  const onCancelClick = e => {
    e.stopPropagation();
    cancel(e);
  };
  return <ModalFooter inProgress={inProgress} errorMessage={errorMessage} message={message}>
    <button type="submit" className="btn btn-primary" disabled={submitDisabled}>{submitText}</button>
    <button type="button" onClick={onCancelClick} className="btn btn-link">Cancel</button>
  </ModalFooter>;
};

ModalSubmitFooter.propTypes = {
  cancel: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired,
  inProgress: PropTypes.bool.isRequired,
  message: PropTypes.string,
  submitText: PropTypes.node.isRequired,
};
