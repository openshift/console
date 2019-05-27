import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { inject, makeReduxID, makeQuery } from './index';
import * as k8sActions from '../../actions/k8s';

const shallowMapEquals = (a, b) => {
  if (a === b || (a.size === 0 && b.size === 0)) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  return a.every((v, k) => b.get(k) === v);
};

const processReduxId = ({k8s}, props) => {
  const {reduxID, isList, filters} = props;

  if (!reduxID) {
    return {};
  }

  if (!isList) {
    const stuff = k8s.get(reduxID);
    return stuff ? stuff.toJS() : {};
  }

  const data = k8s.getIn([reduxID, 'data']);
  const _filters = k8s.getIn([reduxID, 'filters']);
  const selected = k8s.getIn([reduxID, 'selected']);

  return {
    data: data && data.toArray().map(p => p.toJSON()),
    // This is a hack to allow filters passed down from props to make it to
    // the injected component. Ideally filters should all come from redux.
    filters: _.extend({}, _filters && _filters.toJS(), filters),
    kind: props.kind,
    loadError: k8s.getIn([reduxID, 'loadError']),
    loaded: k8s.getIn([reduxID, 'loaded']),
    optional: props.optional,
    selected,
  };
};

const worstError = errors => {
  let worst = errors && errors[0];
  for (const e of errors) {
    if (e.status === 403) {
      return e;
    }
    if (e.status === 401) {
      worst = e;
      continue;
    }
    if (worst.status === 401) {
      continue;
    }
    if (e.status > worst.status) {
      worst = e;
      continue;
    }
  }
  return worst;
};

// A wrapper Component that takes data out of redux for a list or object at some reduxID ...
// passing it to children
const ConnectToState = connect(({k8s}, {reduxes}) => {
  const resources = {};

  reduxes.forEach(redux => {
    resources[redux.prop] = processReduxId({k8s}, redux);
  });

  const required = _.filter(resources, r => !r.optional);
  const loaded = _.every(resources, resource => (resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded));
  const loadError = worstError(_.map(required, 'loadError').filter(Boolean));

  return Object.assign({}, resources, {
    filters: Object.assign({}, ..._.map(resources, 'filters')),
    loaded,
    loadError,
    reduxIDs: _.map(reduxes, 'reduxID'),
    resources,
  });
}, null, null, {
  areStatesEqual: (next, prev) => (next.k8s === prev.k8s),
})(props =>
  inject(props.children, _.omit(props, ['children', 'className', 'reduxes']))
);

const stateToProps = ({k8s}, {resources}) => {
  const k8sModels = resources.reduce((models, {kind}) => models.set(kind, k8s.getIn(['RESOURCES', 'models', kind])), ImmutableMap());
  const loaded = (r) => k8s.getIn([makeReduxID(k8sModels.get(r.kind), makeQuery(r.namespace, r.selector, r.fieldSelector, r.name)), 'loaded']);

  return {
    k8sModels,
    loaded: resources.every(loaded),
    inFlight: k8s.getIn(['RESOURCES', 'inFlight']),
  };
};

export const Firehose = connect(
  stateToProps, {
    stopK8sWatch: k8sActions.stopK8sWatch,
    watchK8sObject: k8sActions.watchK8sObject,
    watchK8sList: k8sActions.watchK8sList,
  }, null, {
    areStatesEqual: (next, prev) => (next.k8s === prev.k8s),
    areStatePropsEqual: (next, prev) => (
      next.loaded === prev.loaded && next.inFlight === prev.inFlight && shallowMapEquals(next.k8sModels, prev.k8sModels)
    ),
  })(
  /** @augments {React.Component<{k8sModels?: Map<string, K8sKind>, forceUpdate?: boolean}>} */
  class Firehose extends React.Component {
    // TODO: Convert this to `componentDidMount`
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
      this.start();
    }

    componentWillUnmount() {
      this.clear();
    }

    shouldComponentUpdate(nextProps) {
      const {forceUpdate = false} = this.props;
      if (nextProps.inFlight !== this.props.inFlight && nextProps.loaded) {
        return forceUpdate;
      }
      return true;
    }

    componentDidUpdate(prevProps) {
      const discoveryComplete = !this.props.inFlight && !this.props.loaded && this.firehoses.length === 0;
      const resourcesChanged = _.intersectionWith(prevProps.resources, this.props.resources, _.isEqual).length !== this.props.resources.length;

      if (discoveryComplete || resourcesChanged) {
        this.clear();
        this.start();
      }
    }

    start() {
      const { watchK8sList, watchK8sObject, resources, k8sModels, inFlight } = this.props;

      if (inFlight && _.some(resources, ({kind}) => !k8sModels.get(kind))) {
        this.firehoses = [];
      } else {
        this.firehoses = resources.map(resource => {
          const query = makeQuery(resource.namespace, resource.selector, resource.fieldSelector, resource.name);
          const k8sKind = k8sModels.get(resource.kind);
          const id = makeReduxID(k8sKind, query);
          return _.extend({}, resource, {query, id, k8sKind});
        }).filter(f => {
          if (_.isEmpty(f.k8sKind)) {
            // eslint-disable-next-line no-console
            console.warn(`No model registered for ${f.kind}`);
          }
          return !_.isEmpty(f.k8sKind);
        });
      }

      this.firehoses.forEach(({ id, query, k8sKind, isList, name, namespace }) => isList
        ? watchK8sList(id, query, k8sKind)
        : watchK8sObject(id, name, namespace, query, k8sKind)
      );
    }

    clear() {
      this.firehoses.forEach(({id}) => this.props.stopK8sWatch(id));
      this.firehoses = [];
    }

    render() {
      const reduxes = this.firehoses.map(({id, prop, isList, filters, optional}) => ({reduxID: id, prop, isList, filters, optional}));
      const children = inject(this.props.children, _.omit(this.props, [
        'children',
        'resources',
      ]));

      return this.props.loaded || this.firehoses.length > 0
        ? <ConnectToState reduxes={reduxes}>{children}</ConnectToState>
        : null;
    }
  }
);
Firehose.WrappedComponent.contextTypes = {
  router: PropTypes.object,
};

Firehose.contextTypes = {
  store: PropTypes.object,
};

Firehose.propTypes = {
  children: PropTypes.node,
  expand: PropTypes.bool,
  forceUpdate: PropTypes.bool,
  resources: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    name: PropTypes.string,
    namespace: PropTypes.string,
    selector: PropTypes.object,
    fieldSelector: PropTypes.string,
    isList: PropTypes.bool,
    optional: PropTypes.bool,
  })).isRequired,
};
