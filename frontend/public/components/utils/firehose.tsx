/* eslint-disable no-undef, no-unused-vars */

import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { inject } from './index';
import { K8sKind, K8sResourceKindReference } from '../../module/k8s';
import actions from '../../module/k8s/k8s-actions';

export const makeReduxID = (k8sKind: K8sKind, query: Query) => {
  let qs = '';
  if (!_.isEmpty(query)) {
    qs = `---${JSON.stringify(query)}`;
  }

  return `${_.get(k8sKind, 'plural')}${qs}`;
};

export const makeQuery = (namespace: string, labelSelector?: LabelSelector, fieldSelector?, name?: string, limit?: number): Query => {
  let query = {} as any;

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

  if (limit) {
    query.limit = limit;
  }
  return query;
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
  for (let e of errors) {
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

const stateToProps = ({k8s}, {reduxes}) => {
  const resources = {} as any;

  reduxes.forEach(redux => {
    resources[redux.prop] = processReduxId({k8s}, redux);
  });

  const required = _.filter(resources, r => !r.optional);
  const loaded = _.every(required, 'loaded');
  const loadError = worstError(_.map(required, 'loadError').filter(Boolean));

  return Object.assign({}, resources, {
    filters: Object.assign({}, ..._.map(resources, 'filters')),
    loaded,
    loadError,
    reduxIDs: _.map(reduxes, 'reduxID'),
    resources,
  });
};

// A wrapper Component that takes data out of redux for a list or object at some reduxID ...
// passing it to children
const ConnectToState = connect(stateToProps)((props: ConnectToStateProps) => <div className={props.className}>
  {inject(props.children, _.omit(props, ['children', 'className', 'reduxes']))}
</div>);

const firehoseStateToProps = ({k8s}, {resources}) => ({
  k8sModels: resources.reduce((models, {kind}) => models.set(kind, k8s.getIn(['RESOURCES', 'models', kind])), ImmutableMap()),
});

export const Firehose = connect(
  firehoseStateToProps, {
    stopK8sWatch: actions.stopK8sWatch,
    watchK8sObject: actions.watchK8sObject,
    watchK8sList: actions.watchK8sList,
  })(
  class Firehose extends React.Component<FirehoseProps> {
    private firehoses = [];

    componentWillMount (props = this.props) {
      const { watchK8sList, watchK8sObject, resources, k8sModels } = props;

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

      this.firehoses.forEach(({ id, query, k8sKind, isList, name, namespace }) => isList
        ? watchK8sList(id, query, k8sKind)
        : watchK8sObject(id, name, namespace, query, k8sKind)
      );
    }

    componentWillUnmount () {
      const { stopK8sWatch } = this.props;

      this.firehoses.forEach(({id}) => stopK8sWatch(id));
      this.firehoses = [];
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
      const currentResources = this.props.resources;

      const { resources, expand } = nextProps;

      if (_.intersectionWith(resources, currentResources, _.isEqual).length === resources.length) {
        if (_.get(nextContext, 'router.route.location.pathname') !== _.get(this.context, 'router.route.location.pathname')) {
          return true;
        }
        if (expand !== this.props.expand) {
          return true;
        }
        return false;
      }
      this.componentWillUnmount();
      this.componentWillMount(nextProps);
      return true;
    }

    render () {
      const reduxes = this.firehoses.map(({id, prop, isList, filters, optional}) => ({reduxID: id, prop, isList, filters, optional}));
      const children = inject(this.props.children, _.omit(this.props, [
        'children',
        'className',
      ]));

      return <ConnectToState reduxes={reduxes}> {children} </ConnectToState>;
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
  resources: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    name: PropTypes.string,
    namespace: PropTypes.string,
    selector: PropTypes.object,
    fieldSelector: PropTypes.string,
    className: PropTypes.string,
    isList: PropTypes.bool,
    optional: PropTypes.bool,
  })).isRequired,
};

export type FirehoseFor = <ResourceKeys extends string>(resources: {[K in ResourceKeys]: FirehoseResource}) =>
  React.ComponentType<{render: (props: {[K in ResourceKeys]: FirehoseResponse}) => JSX.Element}>;

/**
 * Factory function to produce a component that renders a `Firehose` with render props matching `props.resources`.
 */
export const firehoseFor: FirehoseFor = <ResourceKeys extends string>(resources: {[K in ResourceKeys]: FirehoseResource}) => {
  type FirehoseRCProps = {render: (props: {[K in ResourceKeys]: {}}) => JSX.Element};

  // Needed because `Firehose` doesn't support React.Fragment
  const Render = ({render, ...rest}) => render(rest);

  const FirehoseRC: React.SFC<FirehoseRCProps> = (props) => <Firehose resources={_.map(resources, (resource: FirehoseResource, prop) => ({...resource, prop}))}>
    {/* FIXME: Replace this once `Firehose` itself uses render callback */}
    <Render render={props.render} />
  </Firehose>;

  return FirehoseRC;
};

export type FirehoseResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  selector?: {[key: string]: any};
  fieldSelector?: string;
  isList: boolean;
  optional?: boolean;
  prop?: string;
};

export type FirehoseProps = {
  k8sModels: Map<string, K8sKind>;
  watchK8sList: any;
  watchK8sObject: any;
  stopK8sWatch: any;
  resources: FirehoseResource[];
  expand?: boolean;
  children: React.ReactNode;
};

export type ConnectToStateProps = {
  resources: {
    kind: K8sResourceKindReference;
    name: string;
    namespace: string;
    selector: {[key: string]: any};
    fieldSelector: string;
    isList: boolean;
    optional: boolean;
  }[];
  loaded: boolean;
  loadError: string;
  reduxIDs: string[];
  filters: any;
} & React.HTMLProps<any>;

export type FirehoseResponse = {
  loaded: boolean;
  loadError: string | Object;
  // FIXME(alecmerdler)
  data: any;
};

export type LabelSelector = {

};

export type Query = {
  labelSelector: LabelSelector;
  ns: string;
  name: string;
  fieldSelector: string;
};
