import React from 'react';

import {ButtonBar, ErrorMessage} from '../utils';
import {angulars, register} from '../react-wrapper';

export const createModalLauncher = (Component, registeredName) => {
  if (!registeredName) {
    const prefix = Component.name || Component.displayName || 'Modal';
    registeredName =  _.uniqueId(`${prefix}-`);
  }
  register(registeredName, Component);

  return (props) => {
    props = props || {};
    return angulars.modal('reactive-modal', {props, name: registeredName})();
  };
};

export const ModalTitle = ({children}) => <div className="modal-header"><h4 className="modal-title">{children}</h4></div>;
export const ModalBody = ({children}) => <div className="modal-body">{children}</div>;
export const ModalFooter = ({promise, errorFormatter, errorCustomMessage, children}) => {
  return <ButtonBar className="modal-footer" completePromise={promise}>
    <ErrorMessage formatter={errorFormatter} promise={promise} customMessage={errorCustomMessage} />
    {children}
  </ButtonBar>;
};
