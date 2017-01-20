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
export const ModalFooter = ({promise, errorFormatter, errorCustomMessage, children}) => {
  return <ButtonBar className="modal-footer" completePromise={promise}>
    <ErrorMessage formatter={errorFormatter || 'k8sApi'} promise={promise} customMessage={errorCustomMessage} />
    {children}
  </ButtonBar>;
};

export const ModalSubmitFooter = ({promise, errorFormatter, errorCustomMessage, cancel, submitText}) => {
  return <ModalFooter promise={promise} errorFormatter={errorFormatter} errorCustomMessage={errorCustomMessage}>
    <button type="submit" className="btn btn-primary">{submitText}</button>
    <button type="button" onClick={cancel} className="btn btn-link">Cancel</button>
  </ModalFooter>;
};
ModalSubmitFooter.propTypes = {
  cancel: React.PropTypes.func.isRequired,
  submitText: React.PropTypes.node.isRequired
};
