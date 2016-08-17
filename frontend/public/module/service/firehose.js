/**
 * Firehose of all objects of a given type and query.
 */
import actions from '../k8s/k8s-actions';

angular.module('bridge.service')
.service('Firehose', function($ngRedux, _) {
  'use strict';

  const dispatch = (...args) => $ngRedux.dispatch(...args);

  return class Firehose {
    constructor (k8sType, namespace, labelSelector, fieldSelector, name) {
      this.k8sType = k8sType;
      this.query = this.makeQuery_(namespace, labelSelector, fieldSelector, name);
      this.id = this.id_(k8sType, this.query);
      this.namespace = namespace;
      this.name = name;
    }

    watchObject () {
      // eslint-disable-next-line no-console
      console.log(`opening ${this.id}`);
      // watchK8sObject: (id, name, namespace, k8sType)
      dispatch(actions.watchK8sObject(this.id, this.name, this.namespace, this.k8sType));
      return this;
    };

    watchList () {
      // eslint-disable-next-line no-console
      console.log(`opening ${this.id}`);
      dispatch(actions.watchK8sList(this.id, this.query, this.k8sType));
      return this;
    };

    unwatchList () {
      dispatch(actions.stopK8sWatch(this.id));
    };

    bindScope ($scope, name='', onStateChange=null) {
      name = name || this.k8sType.kind.plural;
      $scope[name] = null;
      $scope.loadError = false;

      const unsubscribe = this.watch_($scope, name, onStateChange);

      const off = $scope.$on('$destroy', () => {
        // eslint-disable-next-line no-console
        console.log(`nuking ${this.id}`);
        off();
        unsubscribe();
        this.unwatchList();
      });
      return this;
    };

    watch_ ($scope, name, onStateChange=null) {
      onStateChange = onStateChange || ((state) => _.extend($scope, state));
      const {id} = this;
      return $ngRedux.connect(state => {
        const loaded = state.k8s.getIn([id, 'loaded']);
        const loadError = state.k8s.getIn([id, 'loadError']);
        const data = state.k8s.getIn([id, 'data']);

        return {
          loadError, loaded,
          [name]: data && data.toArray().map(p => p.toJSON()),
        };
      })(state => {
        return onStateChange(state);
      });
    };

    makeQuery_ (namespace, labelSelector, fieldSelector, name) {
      const query = {};

      if (!_.isEmpty(labelSelector)) {
        query.labelSelector = labelSelector;
      }

      if (!_.isEmpty(namespace)) {
        query.ns = namespace;
      }

      if (!_.isEmpty(name)) {
        query.name = name;
      }

      if (fieldSelector) {
        query.fieldSelector = fieldSelector;
      }
      return query;
    }

    id_ (k8sType, query) {
      let qs = '';
      if (!_.isEmpty(query)) {
        qs = '---' + JSON.stringify(query);
      }

      return `${k8sType.kind.plural}${qs}`;
    };
  }
});
