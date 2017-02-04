import React from 'react';

export const angulars = {
  store: null,
  ModalLauncherSvc: null,
};

const app = angular.module('bridge.react-wrapper', ['bridge']);

const toRegister = [];
export const register = (name, Component) => {
  if (app && app.value) {
    return app.value(name, Component);
  }
  toRegister.push({name, Component});
};

app.service('angularBridge', function ($ngRedux, $routeParams, ModalLauncherSvc) {
  // "Export" angular modules to the outside world via ref through 'angulars'...
  // NOTE: this only exist after the app has loaded!

  this.expose = () => {
    _.map(toRegister, ({name, Component}) => {
      app.value(name, Component);
    });

    angulars.store = $ngRedux;
    angulars.ModalLauncherSvc = ModalLauncherSvc;
    angulars.modal = (...args) => () => ModalLauncherSvc.open(...args),
    angulars.routeParams = $routeParams;
  };
});
