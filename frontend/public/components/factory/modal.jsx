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
