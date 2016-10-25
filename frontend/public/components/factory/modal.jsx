import React from 'react';

import {angulars, register} from '../react-wrapper';

export const createModalLauncher = (Component, registeredName) => {
  if (!registeredName) {
    const prefix = Component.name || Component.displayName || 'Modal';
    registeredName =  _.uniqueId(prefix + '-');
  }
  register(registeredName, Component);

  return (props) => {
    props = props || {};
    angulars.modal('reactive-modal', {props, name: registeredName})();
  };
};

export const errorModal = createModalLauncher(
  ({error, close}) => {
    return (
      <div role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title">Error</h1>
          </div>
          <div className="modal-body">
            {error}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={close} className="btn btn-default">OK</button>
          </div>
        </div>
      </div>
    );
  }
);

