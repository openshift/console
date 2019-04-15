import * as React from 'react';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ClusterServiceVersionResourceKind, ClusterServiceVersionKind, referenceForProvidedAPI } from './index';
import { StatusDescriptor } from './descriptors/status';
import { SpecDescriptor } from './descriptors/spec';
// FIXME(alecmerdler): Should not be importing `StatusCapability` enum
import { StatusCapability, Descriptor } from './descriptors/types';
import { Resources } from './k8s-resource';
import { ErrorPage404 } from '../error';
import { MultiListPage, ListPage, DetailsPage, Table, TableRow, TableData } from '../factory';
import { ResourceSummary, StatusBox, navFactory, Timestamp, LabelList, ResourceIcon, MsgBox, ResourceKebab, Kebab, KebabAction, LoadingBox, StatusIconAndText } from '../utils';
import { connectToModel } from '../../kinds';
import { kindForReference, K8sResourceKind, OwnerReference, K8sKind, referenceFor, GroupVersionKind, referenceForModel } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { deleteModal } from '../modals';

const csvName = () => location.pathname.split('/').find((part, i, allParts) => allParts[i - 1] === ClusterServiceVersionModel.plural);

const actions = [
  (kind, obj) => ({
    label: `Edit ${kind.label}`,
    href: `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csvName()}/${referenceFor(obj)}/${obj.metadata.name}/yaml`,
    accessReview: {
      group: kind.apiGroup,
      resource: kind.path,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  }),
  (kind, obj) => ({
    label: `Delete ${kind.label}`,
    callback: () => deleteModal({
      kind,
      resource: obj,
      namespace: obj.metadata.namespace,
      redirectTo: `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csvName()}/${referenceFor(obj)}`,
    }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.path,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'delete',
    },
  }),
] as KebabAction[];

const tableColumnClasses = [
  classNames('pf-m-2-col-on-xl', 'pf-m-3-col-on-lg', 'pf-m-4-col-on-md', 'pf-m-6-col-on-sm'),
  classNames('pf-m-2-col-on-xl', 'pf-m-3-col-on-lg', 'pf-m-4-col-on-md', 'pf-m-6-col-on-sm'),
  classNames('pf-m-2-col-on-xl', 'pf-m-3-col-on-lg', 'pf-m-4-col-on-md', 'pf-m-hidden', 'pf-m-visible-on-md'),
  classNames('pf-m-2-col-on-xl', 'pf-m-3-col-on-lg', 'pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-2-col-on-xl', 'pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-2-col-on-xl', 'pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

export const CSVRTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Type', sortField: 'kind', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status', props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Version', props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Last Updated', props: { className: tableColumnClasses[5] },
    },
    {
      title: '', props: { className: tableColumnClasses[6] },
    },
  ];
};
CSVRTableHeader.displayName = 'CSVRTableHeader';

export const ClusterServiceVersionResourceLink: React.SFC<ClusterServiceVersionResourceLinkProps> = (props) => {
  const {namespace, name} = props.obj.metadata;

  return <span className="co-resource-item">
    <ResourceIcon kind={referenceFor(props.obj)} />
    <Link to={`/k8s/ns/${namespace}/${ClusterServiceVersionModel.plural}/${csvName()}/${referenceFor(props.obj)}/${name}`} className="co-resource-item__resource-name">{name}</Link>
  </span>;
};

export const CSVRTableRow: React.FC<CSVRTableRowProps> = ({obj, index, key, style}) => {
  const status = _.get(obj.status, 'phase');
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ClusterServiceVersionResourceLink obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <LabelList kind={obj.kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        {obj.kind}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.isEmpty(status) ?
          <div className="text-muted">Unknown</div> :
          <StatusIconAndText status={status} iconName={status === 'Running' ? 'ok' : undefined} />
        }
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(obj.spec, 'version') || <div className="text-muted">Unknown</div>}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={actions} kind={referenceFor(obj)} resource={obj} />
      </TableData>
    </TableRow>
  );
};
CSVRTableRow.displayName = 'CSVRTableRow';
export type CSVRTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

export const ClusterServiceVersionResourceList: React.SFC<ClusterServiceVersionResourceListProps> = (props) => {
  const ensureKind = (data: K8sResourceKind[]) => data.map(obj => ({kind: obj.kind || props.kinds[0], ...obj}));
  const EmptyMsg = () => <MsgBox title="No Application Resources Found" detail="Application resources are declarative components used to define the behavior of the application." />;

  return <Table {...props}
    data={ensureKind(props.data)}
    EmptyMsg={EmptyMsg}
    aria-label="Cluster Operators"
    Header={CSVRTableHeader}
    Row={CSVRTableRow}
    virtualize />;
};

const inFlightStateToProps = ({k8s}) => ({inFlight: k8s.getIn(['RESOURCES', 'inFlight'])});

export const ProvidedAPIsPage = connect(inFlightStateToProps)(
  (props: ProvidedAPIsPageProps) => {
    const {obj} = props;
    const {owned = []} = obj.spec.customresourcedefinitions;
    const firehoseResources = owned.map((desc) => ({kind: referenceForProvidedAPI(desc), namespaced: true, prop: desc.kind}));

    const EmptyMsg = () => <MsgBox title="No Application Resources Defined" detail="This application was not properly installed or configured." />;
    const createLink = (name: string) => `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${obj.metadata.name}/${referenceForProvidedAPI(_.find(owned, {name}))}/~new`;
    const createProps = owned.length > 1
      ? {items: owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {}), createLink}
      : {to: owned.length === 1 ? createLink(owned[0].name) : null};

    const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) => ownerRefs.filter(({uid}) => items.filter(({metadata}) => metadata.uid === uid).length > 0);
    const flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => _.flatMap(resources, (resource) => _.map(resource.data, item => item))
      .filter(({kind, metadata}, i, allResources) => owned.filter(item => item.kind === kind).length > 0 || owners(metadata.ownerReferences || [], allResources).length > 0);

    const rowFilters = [{
      type: 'clusterserviceversion-resource-kind',
      selected: firehoseResources.map(({kind}) => kindForReference(kind)),
      reducer: ({kind}) => kind,
      items: firehoseResources.map(({kind}) => ({id: kindForReference(kind), title: kindForReference(kind)})),
    }];

    if (props.inFlight) {
      return null;
    }

    return firehoseResources.length > 0
      ? <MultiListPage
        {...props}
        ListComponent={ClusterServiceVersionResourceList}
        filterLabel="Resources by name"
        resources={firehoseResources}
        namespace={obj.metadata.namespace}
        canCreate={owned.length > 0}
        createProps={createProps}
        createButtonText={owned.length > 1 ? 'Create New' : `Create ${owned[0].displayName}`}
        flatten={flatten}
        rowFilters={firehoseResources.length > 1 ? rowFilters : null}
      />
      : <StatusBox loaded={true} EmptyMsg={EmptyMsg} />;
  });

export const ProvidedAPIPage = connectToModel((props: ProvidedAPIPageProps) => {
  const {namespace, kind, kindsInFlight, kindObj, csv} = props;

  if (!kindObj) {
    return kindsInFlight
      ? <LoadingBox />
      : <ErrorPage404 message={`The server doesn't have a resource type ${kindForReference(kind)}. Try refreshing the page if it was recently added.`} />;
  }

  return <ListPage
    kind={kind}
    ListComponent={ClusterServiceVersionResourceList}
    canCreate={_.get(props.kindObj, 'verbs', [] as string[]).some(v => v === 'create')}
    createProps={{to: `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${kind}/~new`}}
    namespace={_.get(props.kindObj, 'namespaced') ? namespace : null} />;
});

export const ClusterServiceVersionResourceDetails = connectToModel((props: ClusterServiceVersionResourcesDetailsProps) => {
  // TODO(alecmerdler): Use additional `x-descriptor` to specify if should be considered main?
  const isMainDescriptor = (descriptor: Descriptor) => {
    return (descriptor['x-descriptors'] as StatusCapability[] || []).some((type) => {
      switch (type) {
        case StatusCapability.podStatuses:
          return true;
        default:
          return false;
      }
    });
  };

  const blockValue = (descriptor: Descriptor, block: {[key: string]: any}) => !_.isEmpty(descriptor)
    ? _.get(block, descriptor.path, descriptor.value)
    : undefined;

  const {kind, metadata, spec, status} = props.obj;

  // Find the matching CRD spec for the kind of this resource in the CSV.
  const ownedDefinitions = _.get(props.clusterServiceVersion, 'spec.customresourcedefinitions.owned', []);
  const reqDefinitions = _.get(props.clusterServiceVersion, 'spec.customresourcedefinitions.required', []);
  const thisDefinition = _.find(ownedDefinitions.concat(reqDefinitions), (def) => def.name.split('.')[0] === props.kindObj.path);
  const statusDescriptors = _.get<Descriptor[]>(thisDefinition, 'statusDescriptors', []);
  const specDescriptors = _.get<Descriptor[]>(thisDefinition, 'specDescriptors', []);
  const currentStatus = _.find(statusDescriptors, {displayName: 'Status'});
  const primaryDescriptors = statusDescriptors.filter(descriptor => isMainDescriptor(descriptor));

  const header = <h2 className="co-section-heading">{`${thisDefinition ? thisDefinition.displayName : kind} Overview`}</h2>;

  const primaryDescriptor = primaryDescriptors.map((statusDescriptor: Descriptor) => {
    return (
      <div className="row" key={statusDescriptor.displayName}>
        <div className="col-sm-6 col-md-4">
          <StatusDescriptor descriptor={statusDescriptor} value={blockValue(statusDescriptor, status)}
            obj={props.obj} model={props.kindObj} />
        </div>
      </div>
    );
  });

  const details = <div className="co-clusterserviceversion-resource-details__section co-clusterserviceversion-resource-details__section--info">
    <div className="row">
      <div className="col-xs-6">
        <ResourceSummary resource={props.obj} />
      </div>
      { currentStatus &&
      <div className="col-xs-6" key={currentStatus.path}>
        <StatusDescriptor namespace={metadata.namespace} obj={props.obj} model={props.kindObj} descriptor={currentStatus} value={blockValue(currentStatus, status)} />
      </div>
      }

      { specDescriptors.map((specDescriptor: Descriptor, i) =>
        <div key={i} className="col-xs-6">
          <SpecDescriptor namespace={metadata.namespace} obj={props.obj} model={props.kindObj} value={blockValue(specDescriptor, spec)} descriptor={specDescriptor} />
        </div>)
      }

      { statusDescriptors.filter(function(descriptor) {
        return !isMainDescriptor(descriptor) && descriptor.displayName !== 'Status';
      }).map((statusDescriptor: Descriptor) => {
        const statusValue = blockValue(statusDescriptor, status);
        return (
          <div className="col-xs-6" key={statusDescriptor.path}>
            <StatusDescriptor namespace={metadata.namespace} obj={props.obj} model={props.kindObj} descriptor={statusDescriptor} value={statusValue} />
          </div>
        );
      }) }
    </div>
  </div>;

  return <div className="co-clusterserviceversion-resource-details co-m-pane">
    { _.isEmpty(primaryDescriptors) ? (
      <div className="co-m-pane__body">
        {header}
        {details}
      </div>
    ) : (
      <React.Fragment>
        <div className="co-m-pane__body">
          {header}
          {primaryDescriptor}
        </div>
        <div className="co-m-pane__body">
          {details}
        </div>
      </React.Fragment>
    )}
  </div>;
});

export const ClusterServiceVersionResourcesDetailsPage: React.SFC<ClusterServiceVersionResourcesDetailsPageProps> = (props) => <DetailsPage
  {...props}
  resources={[
    {kind: referenceForModel(ClusterServiceVersionModel), name: props.match.params.appName, namespace: props.namespace, isList: false, prop: 'csv'},
  ]}
  menuActions={actions}
  breadcrumbsFor={() => [
    {name: props.match.params.appName, path: props.match.url.slice(0, props.match.url.lastIndexOf('/'))},
    {name: `${kindForReference(props.kind)} Details`, path: `${props.match.url}`},
  ]}
  pages={[
    navFactory.details((detailsProps) => <ClusterServiceVersionResourceDetails {...detailsProps} clusterServiceVersion={detailsProps.csv} appName={props.match.params.appName} />),
    navFactory.editYaml(),
    // eslint-disable-next-line react/display-name
    {name: 'Resources', href: 'resources', component: (resourcesProps) => <Resources {...resourcesProps} clusterServiceVersion={resourcesProps.csv} />},
  ]}
/>;

export type ClusterServiceVersionResourceListProps = {
  loaded: boolean;
  kinds?: GroupVersionKind[];
  data: ClusterServiceVersionResourceKind[];
  filters: {[key: string]: any};
  reduxID?: string;
  reduxIDs?: string[];
  rowSplitter?: any;
  staticFilters?: any;
};

export type ClusterServiceVersionResourceHeaderProps = {
  data: ClusterServiceVersionResourceKind[];
};

export type ClusterServiceVersionResourceRowProps = {
  obj: ClusterServiceVersionResourceKind;
};

export type ProvidedAPIsPageProps = {
  obj: ClusterServiceVersionKind;
  inFlight?: boolean;
};

export type ProvidedAPIPageProps = {
  csv: ClusterServiceVersionKind;
  kindsInFlight?: boolean;
  kind: GroupVersionKind;
  kindObj: K8sKind;
  namespace: string;
};

export type ClusterServiceVersionResourcesDetailsProps = {
  obj: ClusterServiceVersionResourceKind;
  appName: string;
  kindObj: K8sKind;
  clusterServiceVersion: ClusterServiceVersionKind;
};

export type ClusterServiceVersionResourcesDetailsPageProps = {
  kind: GroupVersionKind;
  name: string;
  namespace: string;
  match: match<any>;
};

export type CSVResourceDetailsProps = {
  csv?: {data: ClusterServiceVersionKind};
  kind: GroupVersionKind;
  name: string;
  namespace: string;
  match: match<{appName: string}>;
};

export type ClusterServiceVersionResourceLinkProps = {
  obj: ClusterServiceVersionResourceKind;
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionResourceList.displayName = 'ClusterServiceVersionResourceList';
ClusterServiceVersionResourceDetails.displayName = 'ClusterServiceVersionResourceDetails';
ClusterServiceVersionResourceList.displayName = 'ClusterServiceVersionResourceList';
ClusterServiceVersionResourceLink.displayName = 'ClusterServiceVersionResourceLink';
ProvidedAPIsPage.displayName = 'ProvidedAPIsPage';
ClusterServiceVersionResourcesDetailsPage.displayName = 'ClusterServiceVersionResourcesDetailsPage';
Resources.displayName = 'Resources';
