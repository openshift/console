import React from 'react';

export const angulars = {
  store: null,
  Firehose: null,
  k8s: null,
  kinds: null,
  ModalLauncherSvc: null,
  $location: null,
  $log: null,
  $interval: null,
  $timeout: null,
};

const app = angular.module('bridge.react-wrapper', ['bridge']);

const toRegister = [];
export const register = (name, Component) => {
  if (app && app.value) {
    return app.value(name, Component);
  }
  toRegister.push({name, Component});
};

app.value('nop', () => <div/>);

app.service('angularBridge', function ($ngRedux, $location, $routeParams, $timeout, $interval, $log, Firehose, k8s, ModalLauncherSvc, errorMessageSvc, statusSvc) {
  // "Export" angular modules to the outside world via ref through 'angulars'...
  // NOTE: this only exist after the app has loaded!

  this.expose = () => {
    _.map(toRegister, ({name, Component}) => {
      app.value(name, Component);
    });

    angulars.store = $ngRedux;
    angulars.Firehose = Firehose;
    angulars.k8s = k8s;
    angulars.ModalLauncherSvc = ModalLauncherSvc;
    angulars.modal = (...args) => () => ModalLauncherSvc.open(...args),
    angulars.$location = $location;
    angulars.routeParams = $routeParams;
    angulars.kinds = k8s.enum.Kind;
    angulars.$log = $log;
    angulars.$interval= $interval;
    angulars.$timeout = $timeout;
    angulars.errorMessageSvc = errorMessageSvc;
    angulars.statusSvc = statusSvc;
  };
});

// see https://github.com/ngReact/ngReact#the-react-component-directive
app.directive('reactiveK8sList', function () {
  return {
    template: '<react-component name="{{component}}" props="props"></react-component>',
    restrict: 'E',
    scope: {
      kind: '=',
      // A React Component that has been registered with angular
      component: '=',
      canCreate: '=',
      selector: '=',
      fieldSelector: '=',
      selectorRequired: '=',
    },
    controller: function ($routeParams, $scope, k8s) {
      const { kind, canCreate, selector, fieldSelector, component, selectorRequired } = $scope;

      $scope.props = {
        kind, canCreate, selector, fieldSelector, component, selectorRequired,
        namespace: $routeParams.ns,
        defaultNS: k8s.enum.DefaultNS,
        name: $routeParams.name,
        location: location.pathname,
      };
    }
  };
});
