import React from 'react';
import {Provider} from 'react-redux';

import {angulars, register} from './react-wrapper';
import {actions} from '../ui/ui-actions';
import {makeList, TwoColumns} from './factory';
import {RowOfKind} from './RBAC/role';
import {SparklineWidget} from './sparkline-widget/sparkline-widget';
import {ActionsMenu, Cog, connect, Dropdown, Firehose, LabelList, LoadingInline, NavTitle, ResourceIcon} from './utils';

const kind = 'NAMESPACE';

const FullHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Namespace Name</div>
  <div className="col-xs-4">Namespace Labels</div>
  <div className="col-xs-4">Status</div>
</div>;

const FullRow = ({obj: namespace}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceIcon kind={angulars.kinds.NAMESPACE.id} />
    <a href={`namespaces?name=${namespace.metadata.name}`} title={namespace.metadata.uid}>
      {namespace.metadata.name}
    </a>
  </div>
  <div className="col-xs-4">
    <LabelList kind={angulars.kinds.NAMESPACE.id} labels={namespace.metadata.labels}  />
  </div>
  <div className="col-xs-4">
    {namespace.status.phase}
  </div>
</div>;

const NamespacesList = makeList('Namespaces', kind, FullHeader, FullRow);

class PullSecret extends React.Component {
  constructor (props) {
    super(props);
    this.state = {isLoading: true, data: undefined};
  }

  upsertState (nextState) {
    if (this._isMounted) {
      this.setState(nextState);
    }
  }

  componentDidMount () {
    this._isMounted = true;
    this.load(_.get(this.props, 'namespace.metadata.name'));
  }

  componentWillUnmount () {
    this._isMounted = false;
  }

  load (namespaceName) {
    if (!namespaceName) {
      return;
    }
    const args = `?fieldSelector=${encodeURIComponent('type=kubernetes.io/dockerconfigjson')}`;
    angulars.k8s.secrets.get(args, namespaceName)
      .then((pullSecrets) => {
        this.upsertState({isLoading: false, data: _.get(pullSecrets, 'items[0]')});
      })
      .catch((error) => {
        this.upsertState({isLoading: false, data: undefined});

        // A 404 just means that no pull secrets exist
        if (error.status !== 404) {
          throw error;
        }
      });
  }

  render () {
    if (this.state.isLoading) {
      return <LoadingInline />;
    }
    const modal = angulars.modal('namespace-pull-secret', {namespace: this.props.namespace, pullSecret: this.state.data});
    return <a className="co-m-modal-link" onClick={modal}>{_.get(this.state.data, 'metadata.name') || 'Not Configured'}</a>;
  }
}

const NamespaceSparklines = ({namespace}) => <div className="co-namespace-sparklines">
  <h1 className="co-m-pane__title">Resource Usage</h1>
  <div className="co-namespace-sparklines__wrapper">
    <div className="row no-gutter">
      <div className="col-md-6 col-xs-12">
        <SparklineWidget heading="CPU Shares" query={`namespace:container_spec_cpu_shares:sum{namespace='${namespace.metadata.name}'} * 1000000`} limitQuery="sum(namespace:container_spec_cpu_shares:sum) * 1000000" limitText="cluster" units="numeric" />
      </div>
      <div className="col-md-6 col-xs-12">
        <SparklineWidget heading="RAM" query={`namespace:container_memory_usage_bytes:sum{namespace='${namespace.metadata.name}'}`} limitQuery="sum(namespace:container_memory_usage_bytes:sum)" limitText="cluster" units="binaryBytes" />
      </div>
    </div>
  </div>
</div>;

const Details = (namespace) => {
  if (_.isEmpty(namespace)) {
    return <div className="empty-page">
      <h1 className="empty-page__header">No namespace selected</h1>
      <p className="empty-page__explanation">Namespaces organize and isolate your cluster resources from other things running on the cluster.</p>
    </div>;
  }

  const actions = {DeleteNamespace: Cog.factory.DeleteNamespace(namespace)};
  return <div className="details-page">
    {namespace.metadata.name !== 'default' && <ActionsMenu actions={actions} />}
    <h1 className="co-m-pane__title co-m-pane__body__top-controls">Namespace {namespace.metadata.name}</h1>
    <dl>
      <dt>Status</dt>
      <dd>{namespace.status.phase}</dd>
      <dt>Namespace Labels</dt>
      <dd><LabelList kind="namespace" labels={namespace.metadata.labels} /></dd>
      <dt>Default Pull Secret</dt>
      <dd><PullSecret namespace={namespace} /></dd>
    </dl>
    <NamespaceSparklines namespace={namespace} />
  </div>;
};

const Header = () => <div className="co-m-facet-menu__title">Name</div>;
const List = makeList('Namespaces', kind, Header, RowOfKind('namespace'), ns => ns.metadata.name);

const CreateButton = () => <button type="button" className="btn btn-primary co-m-pane__title__btn" onClick={angulars.modal('new-namespace')}>Create Namespace</button>;

const NamespacesPage = () => <div>
  <NavTitle title="Namespaces" />
  <TwoColumns list={List} topControls={CreateButton}>
    <Details />
  </TwoColumns>
</div>;

const NamespaceDropdown = connect(state => ({namespace: state.UI.get('activeNamespace'), state}))(props => {
  const {data, loaded, state, dispatch} = props;

  // Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
  const allNamespacesKey = '#ALL_NS#';

  const items = {};
  items[allNamespacesKey] = 'all';
  (data || []).sort().forEach(n => {
    const {name} = n.metadata;
    items[name] = name;
  });

  let title = props.namespace || 'all';

  // If the currently active namespace is not found in the list of all namespaces, default to "all"
  if (loaded && !_.has(items, title)) {
    title = 'all';
  }

  const onChange = (newNamespace) => {
    dispatch(actions.setActiveNamespace(state, newNamespace === allNamespacesKey ? undefined : newNamespace));
  };

  return <div className="co-namespace-selector">
    Namespace: <Dropdown className="co-namespace-selector__dropdown" noButton={true} items={items} title={title} onChange={onChange} />
  </div>;
});

const NamespaceSelector = (props) => <Provider store={angulars.store}>
  <Firehose k8sResource={angulars.k8s[angulars.kinds.NAMESPACE.plural]} isList={true}>
    <NamespaceDropdown {...props} />
  </Firehose>
</Provider>;

export {NamespacesPage, NamespacesList, NamespaceSelector};
register('NamespacesPage', NamespacesPage);
register('NamespaceSelector', NamespaceSelector);
