/**
 * Firehose of all objects of a given type and query.
 */
import actions from '../k8s/k8s-actions';

angular.module('bridge.service')
.service('Firehose', function($ngRedux, _) {
  'use strict';

  const dispatch = (...args) => $ngRedux.dispatch(...args);

  return class Firehose {
    constructor (k8sType, namespace, labelSelector, fieldSelector) {
      this.k8sType = k8sType;
      this.query = this.makeQuery_(namespace, labelSelector, fieldSelector);
      this.id = this.id_(k8sType, this.query);
    }

    watchList () {
      // eslint-disable-next-line no-console
      console.log(`opening ${this.id}`);
      dispatch(actions.addList(this.id, this.query, this.k8sType));
      return this;
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
        dispatch(actions.removeList(this.id));
      });
      return this;
    };

    watch_ ($scope, name, onStateChange=null) {
      let nextHash = 0;
      let previousHash = 0;

      onStateChange = onStateChange || ((state) => _.extend($scope, state));

      return $ngRedux.connect(state => {
        const objects = state.k8s.getIn([this.id, 'objects']);
        return {
          [name]: objects && objects.toArray().map(p => {
            const json = p.toJSON()
            nextHash += parseInt(json.metadata.resourceVersion, 10) + parseInt(json.metadata.uid, 10);
            return json;
          }),
          loadError: state.k8s.getIn([this.id, 'loadError']),
        };
      })(state => {
        if (previousHash === nextHash) {
          // eslint-disable-next-line no-console
          return;
        }
        // eslint-disable-next-line no-console
        console.info(`updated ${name} (${_.size(state[name])})`);
        previousHash = nextHash;
        nextHash = 0;
        return onStateChange(state);
      });
    };

    makeQuery_ (namespace, labelSelector, fieldSelector) {
      const query = {};

      if (!_.isEmpty(labelSelector)) {
        query.labelSelector = labelSelector;
      }

      if (!_.isEmpty(namespace)) {
        query.ns = namespace;
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
