import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { inject } from './inject';
import { makeReduxID, makeQuery } from './k8s-watcher';
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

const processReduxId = ({ k8s }, props) => {
  const { reduxID, isList, filters } = props;

  if (!reduxID) {
    return {};
  }

  if (!isList) {
    let stuff = k8s.get(reduxID);
    if (stuff) {
      stuff = stuff.toJS();
      stuff.optional = props.optional;
    }
    return stuff || {};
  }

  const data = k8s.getIn([reduxID, 'data']);
  const _filters = k8s.getIn([reduxID, 'filters']);
  const selected = k8s.getIn([reduxID, 'selected']);

  return {
    data: data && data.toArray().map((p) => p.toJSON()),
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

const worstError = (errors) => {
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

const mapStateToProps = ({ k8s }) => ({
  k8s,
});

const propsAreEqual = (prevProps, nextProps) => {
  if (nextProps.children === prevProps.children && nextProps.reduxes === prevProps.reduxes) {
    return nextProps.reduxes.every(
      ({ reduxID }) => prevProps.k8s.get(reduxID) === nextProps.k8s.get(reduxID),
    );
  }
  return false;
};

// A wrapper Component that takes data out of redux for a list or object at some reduxID ...
// passing it to children
const ConnectToState = connect(mapStateToProps)(
  React.memo(({ k8s, reduxes, children }) => {
    const resources = {};

    reduxes.forEach((redux) => {
      resources[redux.prop] = processReduxId({ k8s }, redux);
    });

    const required = _.filter(resources, (r) => !r.optional);
    const loaded = _.every(resources, (resource) =>
      resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
    );
    const loadError = worstError(_.map(required, 'loadError').filter(Boolean));

    const k8sResults = Object.assign({}, resources, {
      filters: Object.assign({}, ..._.map(resources, 'filters')),
      loaded,
      loadError,
      reduxIDs: _.map(reduxes, 'reduxID'),
      resources,
    });

    return inject(children, k8sResults);
  }, propsAreEqual),
);

const stateToProps = ({ k8s }, { resources }) => {
  const k8sModels = resources.reduce(
    (models, { kind }) => models.set(kind, k8s.getIn(['RESOURCES', 'models', kind])),
    ImmutableMap(),
  );
  const loaded = (r) => {
    return (
      (r.optional && _.isUndefined(k8sModels.get(r.kind))) ||
      k8s.getIn([
        makeReduxID(
          k8sModels.get(r.kind),
          makeQuery(r.namespace, r.selector, r.fieldSelector, r.name),
        ),
        'loaded',
      ])
    );
  };

  return {
    k8sModels,
    loaded: resources.every(loaded),
    inFlight: k8s.getIn(['RESOURCES', 'inFlight']),
  };
};

export const Firehose = connect(
  stateToProps,
  {
    stopK8sWatch: k8sActions.stopK8sWatch,
    watchK8sObject: k8sActions.watchK8sObject,
    watchK8sList: k8sActions.watchK8sList,
  },
  null,
  {
    areStatesEqual: (next, prev) => next.k8s === prev.k8s,
    areStatePropsEqual: (next, prev) =>
      next.loaded === prev.loaded &&
      next.inFlight === prev.inFlight &&
      shallowMapEquals(next.k8sModels, prev.k8sModels),
  },
)(
  /** @augments {React.Component<{k8sModels?: Map<string, K8sKind>, doNotConnectToState?: boolean}>} */
  class Firehose extends React.Component {
    state = {
      firehoses: [],
    };

    // TODO: Convert this to `componentDidMount`
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
      this.start();
    }

    componentWillUnmount() {
      this.clear();
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (
        Object.keys(nextProps).length === Object.keys(this.props).length &&
        Object.keys(nextProps)
          .filter((key) => key !== 'inFlight')
          .every((key) => nextProps[key] === this.props[key]) &&
        (nextState === this.state ||
          (nextState.firehoses.length === 0 && this.state.firehoses.length === 0))
      ) {
        return this.props.loaded ? false : this.props.inFlight !== nextProps.inFlight;
      }
      return true;
    }

    componentDidUpdate(prevProps) {
      const discoveryComplete =
        !this.props.inFlight && !this.props.loaded && this.state.firehoses.length === 0;
      const resourcesChanged =
        _.intersectionWith(prevProps.resources, this.props.resources, _.isEqual).length !==
        this.props.resources.length;

      if (discoveryComplete || resourcesChanged) {
        this.clear();
        this.start();
      }
    }

    start() {
      const { watchK8sList, watchK8sObject, resources, k8sModels, inFlight } = this.props;

      let firehoses = [];
      if (!(inFlight && _.some(resources, ({ kind }) => !k8sModels.get(kind)))) {
        firehoses = resources
          .map((resource) => {
            const query = makeQuery(
              resource.namespace,
              resource.selector,
              resource.fieldSelector,
              resource.name,
              resource.limit,
            );
            const k8sKind = k8sModels.get(resource.kind);
            const id = makeReduxID(k8sKind, query);
            return _.extend({}, resource, { query, id, k8sKind });
          })
          .filter((f) => {
            if (_.isEmpty(f.k8sKind)) {
              // eslint-disable-next-line no-console
              console.warn(`No model registered for ${f.kind}`);
            }
            return !_.isEmpty(f.k8sKind);
          });
      }

      firehoses.forEach(({ id, query, k8sKind, isList, name, namespace }) =>
        isList
          ? watchK8sList(id, query, k8sKind)
          : watchK8sObject(id, name, namespace, query, k8sKind),
      );
      this.setState({ firehoses });
    }

    clear() {
      this.state.firehoses.forEach(({ id }) => this.props.stopK8sWatch(id));
    }

    render() {
      if (this.props.loaded || this.state.firehoses.length > 0) {
        const children = inject(this.props.children, _.omit(this.props, ['children', 'resources']));

        if (this.props.doNotConnectToState) {
          return children;
        }

        const reduxes = this.state.firehoses.map(
          ({ id, prop, isList, filters, optional, kind }) => ({
            reduxID: id,
            prop,
            isList,
            filters,
            optional,
            kind,
          }),
        );
        return <ConnectToState reduxes={reduxes}>{children}</ConnectToState>;
      }
      return null;
    }
  },
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
  doNotConnectToState: PropTypes.bool,
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      kind: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
      name: PropTypes.string,
      namespace: PropTypes.string,
      selector: PropTypes.object,
      fieldSelector: PropTypes.string,
      isList: PropTypes.bool,
      optional: PropTypes.bool, // do not block children-rendering while resource is still being loaded; do not fail if resource is missing (404)
      limit: PropTypes.number,
    }),
  ).isRequired,
};
