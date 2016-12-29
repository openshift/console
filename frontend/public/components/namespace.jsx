import React from 'react';
import {Provider} from 'react-redux';

import {angulars, register} from './react-wrapper';
import {actions, getActiveNamespace, isNamespaced} from '../ui/ui-actions';
import {makeList, TwoColumns} from './factory';
import {RowOfKind} from './RBAC/role';
import {SafetyFirst} from './safety-first';
import {SparklineWidget} from './sparkline-widget/sparkline-widget';
import {ActionsMenu, connect, Dropdown, Firehose, LabelList, LoadingInline, NavTitle, ResourceIcon} from './utils';
import {deleteNamespaceModal} from './modals';

const FullHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Namespace Name</div>
  <div className="col-xs-4">Namespace Labels</div>
  <div className="col-xs-4">Status</div>
</div>;

const FullRow = ({obj: namespace}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceIcon kind="namespace" />
    <a href={`namespaces?name=${namespace.metadata.name}`} title={namespace.metadata.uid}>
      {namespace.metadata.name}
    </a>
  </div>
  <div className="col-xs-4">
    <LabelList kind="namespace" labels={namespace.metadata.labels} />
  </div>
  <div className="col-xs-4">
    {namespace.status.phase}
  </div>
</div>;

const NamespacesList = makeList('Namespaces', 'namespace', FullHeader, FullRow);

class PullSecret extends SafetyFirst {
  constructor (props) {
    super(props);
    this.state = {isLoading: true, data: undefined};
  }

  componentDidMount () {
    super.componentDidMount();
    this.load(_.get(this.props, 'namespace.metadata.name'));
  }

  load (namespaceName) {
    if (!namespaceName) {
      return;
    }
    const args = `?fieldSelector=${encodeURIComponent('type=kubernetes.io/dockerconfigjson')}`;
    angulars.k8s.secrets.get(args, namespaceName)
      .then((pullSecrets) => {
        this.setState({isLoading: false, data: _.get(pullSecrets, 'items[0]')});
      })
      .catch((error) => {
        this.setState({isLoading: false, data: undefined});

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

  const openDeleteNamespaceModal = function() {
    deleteNamespaceModal({
      resource: namespace
    });
  };

  const cogActions = {
    DeleteNamespace: {
      label: 'Delete Namespace',
      callback: openDeleteNamespaceModal
    }
  };

  return <div className="details-page">
    {namespace.metadata.name !== 'default' && namespace.status.phase !== 'Terminating' && <ActionsMenu actions={cogActions} />}
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
const List = makeList('Namespaces', 'namespace', Header, RowOfKind('namespace'));

const CreateButton = () => <button type="button" className="btn btn-primary co-m-pane__title__btn" onClick={angulars.modal('new-namespace')}>Create Namespace</button>;

const NamespacesPage = () => <div>
  <NavTitle title="Namespaces" />
  <TwoColumns list={List} topControls={CreateButton}>
    <Details />
  </TwoColumns>
</div>;

const NamespaceDropdown = connect(() => ({namespace: getActiveNamespace()}))(props => {
  // Don't show namespace dropdown unless the namespace is relevant to the current page
  if(!isNamespaced(window.location.pathname)) {
    return null;
  }

  const {data, loaded, namespace, dispatch} = props;

  // Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
  const allNamespacesKey = '#ALL_NS#';

  const items = {};
  items[allNamespacesKey] = 'all';
  _.map(data, 'metadata.name').sort().forEach(name => items[name] = name);

  let title = namespace || 'all';

  // If the currently active namespace is not found in the list of all namespaces, default to "all"
  if (loaded && !_.has(items, title)) {
    title = 'all';
  }

  const onChange = (newNamespace) => {
    dispatch(actions.setActiveNamespace(newNamespace === allNamespacesKey ? undefined : newNamespace));
  };

  return <div className="co-namespace-selector">
    Namespace: <Dropdown className="co-namespace-selector__dropdown" noButton={true} items={items} title={title} onChange={onChange} />
  </div>;
});

const NamespaceSelector = (props) => <Provider store={angulars.store}>
  <Firehose kind="namespace" isList={true}>
    <NamespaceDropdown {...props} />
  </Firehose>
</Provider>;

export {NamespacesPage, NamespacesList, NamespaceSelector};
register('NamespacesPage', NamespacesPage);
register('NamespaceSelector', NamespaceSelector);
