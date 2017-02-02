import React from 'react';

import {ButtonBar, ErrorMessage} from '../utils';
import {angulars, register} from '../react-wrapper';

export const createModalLauncher = (Component, registeredName, config = {}) => {
  if (!registeredName) {
    const prefix = Component.name || Component.displayName || 'Modal';
    registeredName =  _.uniqueId(`${prefix}-`);
  }
  register(registeredName, Component);

  return (props) => {
    props = props || {};
    return angulars.modal('reactive-modal', {props, name: registeredName}, config)();
  };
};

export const ModalTitle = ({children}) => <div className="modal-header"><h4 className="modal-title">{children}</h4></div>;
export const ModalBody = ({children}) => <div className="modal-body">{children}</div>;
export const ModalFooter = ({message, errorMessage, inProgress, children}) => {
  return <ButtonBar className="modal-footer" message={message} inProgress={inProgress}>
    <ErrorMessage errorMessage={errorMessage} />
    {children}
  </ButtonBar>;
};

export const ModalSubmitFooter = ({message, errorMessage, inProgress, cancel, submitText}) => {
  return <ModalFooter inProgress={inProgress} errorMessage={errorMessage} message={message}>
    <button type="submit" className="btn btn-primary">{submitText}</button>
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
