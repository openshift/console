import * as React from 'react';
import { Link, match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';

import { ClusterServiceVersionKind, ClusterServiceVersionLogo, CRDDescription, ClusterServiceVersionPhase, referenceForCRDDesc, AppCatalog, appCatalogLabel } from './index';
import { ClusterServiceVersionResourcesPage } from './clusterserviceversion-resource';
import { DetailsPage, ListHeader, ColHead, MultiListPage, List } from '../factory';
import { navFactory, StatusBox, Timestamp, ResourceLink, OverflowLink, Dropdown, history, MsgBox, makeReduxID, makeQuery, Box, Cog, ResourceCog } from '../utils';
import { withFallback } from '../utils/error-boundary';
import { K8sResourceKind, referenceForModel, referenceFor } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { AsyncComponent } from '../utils/async';

import * as appsLogo from '../../imgs/apps-logo.svg';

export const ClusterServiceVersionListItem: React.SFC<ClusterServiceVersionListItemProps> = (props) => {
  const {obj, namespaces = []} = props;
  const route = (namespace) => `/ns/${namespace}/applications/${obj.metadata.name}`;

  return <div className="co-clusterserviceversion-list-item">
    <div style={{cursor: namespaces.length === 1 ? 'pointer' : ''}} onClick={() => namespaces.length === 1 ? history.push(route(obj.metadata.namespace)) : null}>
      <ClusterServiceVersionLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} version={obj.spec.version} provider={obj.spec.provider} />
    </div>
    <div className="co-clusterserviceversion-list-item__description">{_.get(obj.spec, 'description', 'No description available')}</div>
    <div className="co-clusterserviceversion-list-item__actions">
      { namespaces.length > 1
        ? <Dropdown
          title="View namespace"
          items={namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {})}
          onChange={(ns) => history.push(`${route(ns)}`)} />
        : <Link to={route(obj.metadata.namespace)} title="View details" className="btn btn-default">View details</Link> }
      { namespaces.length === 1 && <Link to={`${route(obj.metadata.namespace)}/instances`} title="View instances">View instances</Link> }
    </div>
  </div>;
};

export const ClusterServiceVersionHeader: React.SFC = () => <ListHeader>
  <ColHead className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead className="col-xs-3">Namespace</ColHead>
  <ColHead className="col-xs-3">Status</ColHead>
  <ColHead className="col-xs-3" />
</ListHeader>;

export const ClusterServiceVersionRow = withFallback<ClusterServiceVersionRowProps>(({obj}) => {
  const route = `/ns/${obj.metadata.namespace}/applications/${obj.metadata.name}`;

  const installStatus = obj.status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded
    ? <span>Enabled</span>
    : <span className="co-error"><i className="fa fa-times-circle co-icon-space-r" /> {obj.status.reason}</span>;

  return <div className="row co-resource-list__item" style={{display: 'flex', alignItems: 'center'}}>
    <div className="col-xs-3" style={{display: 'flex', alignItems: 'center'}}>
      <ResourceCog resource={obj} kind={referenceFor(obj)} actions={[Cog.factory.Delete, () => ({label: 'Edit Application Definition...', href: `${route}/edit`})]} />
      <Link to={route}>
        <ClusterServiceVersionLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} version={obj.spec.version} provider={obj.spec.provider} />
      </Link>
    </div>
    <div className="col-xs-3">
      <ResourceLink kind="Namespace" title={obj.metadata.namespace} name={obj.metadata.namespace} />
    </div>
    <div className="col-xs-4">{ obj.metadata.deletionTimestamp ? 'Disabling' : installStatus }</div>
    <div className="col-xs-2">
      <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
        <Link to={`${route}/instances`} title="View instances">View instances</Link>
      </div>
    </div>
  </div>;
});

const EmptyAppsMsg = () => <MsgBox title="No Applications Found" detail={<div>
  Applications are installed per namespace from the Open Cloud Catalog. For more information, see <a href="https://coreos.com/tectonic/docs/latest/alm/using-ocs.html" target="_blank" rel="noopener noreferrer">Using Open Cloud Services <i className="fa fa-external-link" /></a>.
</div>} />;

export const ClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = (props) => {
  const {loaded, loadError, filters} = props;
  const clusterServiceVersions = (props.data.filter(res => referenceFor(res) === referenceForModel(ClusterServiceVersionModel)) as ClusterServiceVersionKind[])
    .filter(csv => csv.status && csv.status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded);
  const apps = Object.keys(filters).reduce((filteredData, filterName) => {
    // TODO(alecmerdler): Make these cases into TypeScript `enum` values
    switch (filterName) {
      case 'name':
        return filteredData.filter((csv) => csv.spec.displayName.toLowerCase().includes(filters[filterName].toLowerCase()));
      case 'clusterserviceversion-status':
        if (filters[filterName] === 'running') {
          return filteredData.filter(({metadata, spec}) => spec.customresourcedefinitions.owned.some(({kind}) => props.data.some(res => res.kind === kind && res.metadata.namespace === metadata.namespace)));
        } else if (filters[filterName] === 'notRunning') {
          return filteredData.filter(({metadata, spec}) => !spec.customresourcedefinitions.owned.some(({kind}) => props.data.some(res => res.kind === kind && res.metadata.namespace === metadata.namespace)));
        }
        return filteredData;
      case 'clusterserviceversion-catalog':
        return filteredData.filter((csv) => filters[filterName] === 'all' || csv.spec.labels['alm-catalog'] === filters[filterName]);
      default:
        return filteredData;
    }
  }, clusterServiceVersions);
  const namespacesForApp = (name) => apps.filter(({metadata}) => metadata.name === name).map(({metadata}) => metadata.namespace);
  const hasDeployment = (csvUID: string) => props.data.some(obj => _.get(obj.metadata, 'ownerReferences', []).some(({uid}) => uid === csvUID));

  return <div>{ apps.length > 0
    ? <div className="co-clusterserviceversion-list">
      { apps.filter(({metadata}, i, allCSVs) => i === _.findIndex(allCSVs, (csv => csv.metadata.name === metadata.name)))
        .filter((csv) => hasDeployment(csv.metadata.uid))
        .map((csv, i) => <div className="co-clusterserviceversion-list__tile" key={i}>
          <ClusterServiceVersionListItem obj={csv} namespaces={namespacesForApp(csv.metadata.name)} />
        </div>) }
    </div>
    : <StatusBox label="Applications" loaded={loaded} loadError={loadError} EmptyMsg={EmptyAppsMsg} /> }
  </div>;
};

const stateToProps = ({k8s}, {match}) => ({
  resourceDescriptions: _.values(k8s.getIn([makeReduxID(ClusterServiceVersionModel, makeQuery(match.params.ns)), 'data'], ImmutableMap()).toJS())
    .map((csv: ClusterServiceVersionKind) => _.get(csv.spec.customresourcedefinitions, 'owned', []))
    .reduce((descriptions, crdDesc) => descriptions.concat(crdDesc), [])
    .filter((crdDesc, i, allDescriptions) => i === _.findIndex(allDescriptions, ({name}) => name === crdDesc.name)),
  namespaceEnabled: _.values<K8sResourceKind>(k8s.getIn(['namespaces', 'data'], ImmutableMap()).toJS())
    .filter((ns) => ns.metadata.name === match.params.ns && _.get(ns, ['metadata', 'annotations', 'alm-manager']))
    .length === 1,
});

const EmptyCustomAppsMsg = () => <MsgBox title="No Custom Applications Found" detail={<div>
  Create custom applications by using the <a href="https://github.com/coreos/helm-app-operator-kit" target="_blank" rel="noopener noreferrer">Helm App Operator Kit <i className="fa fa-external-link" /></a>.
</div>} />;

export const ClusterServiceVersionsPage = connect(stateToProps)(
  class ClusterServiceVersionsPage extends React.Component<ClusterServiceVersionsPageProps, ClusterServiceVersionsPageState> {
    constructor(props) {
      super(props);
      this.state = {resourceDescriptions: []};
    }

    render() {
      const flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => _.flatMap(resources, (resource) => _.map(resource.data, item => item));
      const dropdownFilters = [{
        type: 'clusterserviceversion-status',
        items: {
          all: 'Status: All',
          running: 'Status: Running',
          notRunning: 'Status: Not Running',
        },
        title: 'Running Status',
        align: 'left',
      }, {
        type: 'clusterserviceversion-catalog',
        items: {
          all: 'Catalog: All',
        },
        title: 'Catalog',
        align: 'left',
      }];
      const csvResource = {kind: referenceForModel(ClusterServiceVersionModel), namespaced: true, prop: 'ClusterServiceVersion-v1'};

      return this.props.match.params.ns && !this.props.namespaceEnabled
        ? <Box className="cos-text-center">
          <img className="co-clusterserviceversion-list__disabled-icon" src={appsLogo} />
          <MsgBox title="Open Cloud Services not enabled for this namespace" detail="Please contact a system administrator and ask them to enable OCS to continue." />
        </Box>
        : <div>
          <div className="col-xs-12">
            <h1 className="co-m-page-title" style={{paddingBottom: '30px'}}>
              <span id="resource-title">Available Applications</span>
            </h1>
          </div>
          <div>
            <div className="col-xs-12">
              <h3 className="co-clusterserviceversion-list__title">Open Cloud Services</h3>
            </div>
            <MultiListPage
              {...this.props}
              namespace={this.props.match.params.ns}
              resources={[
                {...csvResource, selector: {matchLabels: {[appCatalogLabel]: AppCatalog.tectonicOCS}}},
                {kind: 'Deployment', namespaced: true, isList: true, prop: 'Deployment'},
                ...this.state.resourceDescriptions.map(crdDesc => ({kind: referenceForCRDDesc(crdDesc), namespaced: true, optional: true, prop: crdDesc.kind, selector: null})),
              ]}
              flatten={flatten}
              dropdownFilters={dropdownFilters}
              ListComponent={ClusterServiceVersionList}
              filterLabel="Applications by name"
              showTitle={false} />
          </div>
          <div>
            <div className="col-xs-12">
              <h3 className="co-clusterserviceversion-list__title">Custom Applications</h3>
              <MultiListPage
                {...this.props}
                namespace={this.props.match.params.ns}
                resources={[{...csvResource, selector: {matchExpressions: [{key: appCatalogLabel, operator: 'DoesNotExist', values: []}]}}]}
                ListComponent={(props) => <List {...props} Row={ClusterServiceVersionRow} Header={ClusterServiceVersionHeader} EmptyMsg={EmptyCustomAppsMsg} />}
                flatten={flatten}
                filterLabel="Custom Applications by name"
                showTitle={false} />
            </div>
          </div>
        </div>;
    }

    componentWillReceiveProps(nextProps) {
      if (this.state.resourceDescriptions.length === 0 && nextProps.resourceDescriptions.length > 0) {
        this.setState({resourceDescriptions: nextProps.resourceDescriptions});
      }
    }

    // FIXME(alecmerdler): This is a hack to prevent infinite re-render from depending on its own props to populate Redux
    shouldComponentUpdate(nextProps) {
      return !_.isEqual(_.omit(nextProps, ['resourceDescriptions']), _.omit(this.props, ['resourceDescriptions']))
        || nextProps.resourceDescriptions.length > 0 && this.state.resourceDescriptions.length === 0;
    }
  });

export const MarkdownView = (props: {content: string}) => {
  return <AsyncComponent loader={() => import('./markdown-view').then(c => c.SyncMarkdownView)} {...props} />;
};

export const ClusterServiceVersionDetails: React.SFC<ClusterServiceVersionDetailsProps> = (props) => {
  const {spec, metadata, status} = props.obj;
  const ownedCRDs = spec.customresourcedefinitions.owned || [];
  const route = (name: string) => `/ns/${metadata.namespace}/applications/${metadata.name}/${referenceForCRDDesc(_.find(ownedCRDs, {name}))}/new`;

  return <div className="co-clusterserviceversion-details co-m-pane__body">
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--info">
      <div style={{marginBottom: '15px'}}>
        { status.phase !== ClusterServiceVersionPhase.CSVPhaseSucceeded && <button disabled={true} className="btn btn-primary">Create New</button> }
        { status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded && ownedCRDs.length > 1 && <Dropdown
          noButton={true}
          className="btn btn-primary"
          title="Create New"
          items={ownedCRDs.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {})}
          onChange={(name) => history.push(route(name))} /> }
        { status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded && ownedCRDs.length === 1 && <Link to={route(ownedCRDs[0].name)} className="btn btn-primary">{`Create ${ownedCRDs[0].displayName}`}</Link> }
      </div>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Provider</dt>
        <dd>{spec.provider && spec.provider.name ? spec.provider.name : 'Not available'}</dd>
        <dt>Created At</dt>
        <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
      </dl>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Links</dt>
        { spec.links && spec.links.length > 0
          ? spec.links.map((link, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {link.name} <OverflowLink value={link.url} href={link.url} />
          </dd>)
          : <dd>Not available</dd> }
      </dl>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Maintainers</dt>
        { spec.maintainers && spec.maintainers.length > 0
          ? spec.maintainers.map((maintainer, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {maintainer.name} <OverflowLink value={maintainer.email} href={`mailto:${maintainer.email}`} />
          </dd>)
          : <dd>Not available</dd> }
      </dl>
    </div>
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--description">
      { status.phase !== ClusterServiceVersionPhase.CSVPhaseSucceeded && <div className="co-clusterserviceversion-detail__error-box">
        <strong>Install {status.phase}</strong>: {status.message}
      </div> }
      <h1>Description</h1>
      <MarkdownView content={spec.description || 'Not available'} />
    </div>
  </div>;
};

export const ClusterServiceVersionsDetailsPage: React.StatelessComponent<ClusterServiceVersionsDetailsPageProps> = (props) => {
  const Instances: React.SFC<{obj: ClusterServiceVersionKind}> = ({obj}) => <ClusterServiceVersionResourcesPage obj={obj} />;
  Instances.displayName = 'Instances';

  return <DetailsPage
    {...props}
    namespace={props.match.params.ns}
    kind={referenceForModel(ClusterServiceVersionModel)}
    name={props.match.params.name}
    pages={[navFactory.details(ClusterServiceVersionDetails), {href: 'instances', name: 'Instances', component: Instances}]}
    menuActions={[() => ({label: 'Edit Application Definition...', href: `/ns/${props.match.params.ns}/applications/${props.match.params.name}/edit`})]} />;
};

/* eslint-disable no-undef */
export type ClusterServiceVersionsPageProps = {
  kind: string;
  namespaceEnabled: boolean;
  match: RouterMatch<{ns?: string}>;
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionsPageState = {
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionListProps = {
  loaded: boolean;
  loadError?: string;
  data: (ClusterServiceVersionKind | K8sResourceKind)[];
  filters: {[key: string]: any};
};

export type ClusterServiceVersionListItemProps = {
  obj: ClusterServiceVersionKind;
  namespaces: string[];
};

export type ClusterServiceVersionsDetailsPageProps = {
  match: RouterMatch<any>;
};

export type ClusterServiceVersionDetailsProps = {
  obj: ClusterServiceVersionKind;
};

export type ClusterServiceVersionRowProps = {
  obj: ClusterServiceVersionKind;
};
/* eslint-enable no-undef */

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionListItem.displayName = 'ClusterServiceVersionListItem';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionRow.displayName = 'ClusterServiceVersionRow';
ClusterServiceVersionHeader.displayName = 'ClusterServiceVersionHeader';
