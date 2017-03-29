import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';

import { ButtonBar, ErrorMessage } from '../utils';

export const createModalLauncher = (Component) => (props = {}) => {
  const modalContainer = document.getElementById('modal-container');

  const result = new Promise(resolve => {
    const closeModal = e => {
      // Disable closing the modal with the escape key for "blocking" modals
      if (props.blocking && _.get(e, 'type') === 'keydown') {
        return;
      }
      ReactDOM.unmountComponentAtNode(modalContainer);
      resolve();
    };

    ReactDOM.render(<Modal
      isOpen={true}
      contentLabel="Modal"
      onRequestClose={closeModal}
      className="co-modal"
      overlayClassName="co-overlay"
      shouldCloseOnOverlayClick={!props.blocking}>
      <div className="modal-dialog">
        <div className="modal-content">
          <Component {...props} cancel={closeModal} close={closeModal} />
        </div>
      </div>
    </Modal>, modalContainer);
  });
  return {result};
};

export const ModalTitle = ({children}) => <div className="modal-header"><h4 className="modal-title">{children}</h4></div>;

export const ModalBody = ({children}) => <div className="modal-body">{children}</div>;

export const ModalFooter = ({message, errorMessage, inProgress, children}) => {
  return <ButtonBar className="modal-footer" message={message} inProgress={inProgress}>
    <ErrorMessage errorMessage={errorMessage} />
    {children}
  </ButtonBar>;
};

export const ModalSubmitFooter = ({message, errorMessage, inProgress, cancel, submitText, submitDisabled}) => {
  return <ModalFooter inProgress={inProgress} errorMessage={errorMessage} message={message}>
    <button type="submit" className="btn btn-primary" disabled={submitDisabled}>{submitText}</button>
    <button type="button" onClick={cancel} className="btn btn-link">Cancel</button>
  </ModalFooter>;
};

ModalSubmitFooter.propTypes = {
  cancel: React.PropTypes.func.isRequired,
  errorMessage: React.PropTypes.string.isRequired,
  inProgress: React.PropTypes.bool.isRequired,
  message: React.PropTypes.string,
  submitText: React.PropTypes.node.isRequired,
};
