import {connect, Provider} from 'react-redux';
import React from 'react';

export const angulars = {
  store: null,
  Firehose: null,
  k8s: null,
  kinds: null,
  resourceMgrSvc: null,
  ModalLauncherSvc: null,
  $location: null,
};

const app = angular.module('bridge.react-wrapper', ['bridge']);
 
export const withHose = (Component, firehoseId) => {
  const stateToProps = ({k8s}) => {
    const objects = k8s.getIn([firehoseId, 'objects']);
    const filters = k8s.getIn([firehoseId, 'filters']);
    return {
      objects: objects && objects.toArray().map(p => p.toJSON()),
      filters: filters && filters.toJS(),
      loadError: k8s.getIn([firehoseId, 'loadError']),
      loaded: k8s.getIn([firehoseId, 'loaded']),
    };
  };

  return connect(stateToProps)(Component);
};

export const withStoreAndHose = (Component, firehoseId) => {
  const Hosed = withHose(Component, firehoseId);

  return (props) => <Provider store={angulars.store}><Hosed {...props} /></Provider>;
};

export const register = (name, Component) => {
  app.value(name, Component);
};

app.service('angularBridge', function ($ngRedux, $location, Firehose, k8s, ModalLauncherSvc, resourceMgrSvc) {
  // "Export" angular modules to the outside world via ref through 'angulars'...
  // NOTE: this only exist after the app has loaded!

  this.expose = () => {
    angulars.store = $ngRedux;
    angulars.Firehose = Firehose;
    angulars.k8s = k8s;
    angulars.ModalLauncherSvc = ModalLauncherSvc;
    angulars.modal = (...args) => () => ModalLauncherSvc.open(...args),
    angulars.$location = $location;
    angulars.kinds = k8s.enum.Kind;
    angulars.resourceMgrSvc = resourceMgrSvc;
  }
});

// see https://github.com/ngReact/ngReact#the-react-component-directive
app.directive('reactiveK8sList', function () {
  return {
    template: '<react-component name="{{component}}" props="props"> </react-component>',
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
      };
    }
  };
});
