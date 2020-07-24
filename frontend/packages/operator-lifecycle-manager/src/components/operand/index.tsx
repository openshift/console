import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { match } from 'react-router-dom';
import { connect } from 'react-redux';
import { sortable } from '@patternfly/react-table';
import { JSONSchema6 } from 'json-schema';
import { Status, SuccessStatus } from '@console/shared';
import { Conditions } from '@console/internal/components/conditions';
import { ErrorPage404 } from '@console/internal/components/error';
import {
  MultiListPage,
  ListPage,
  DetailsPage,
  Table,
  TableRow,
  TableData,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import {
  Kebab,
  KebabAction,
  LabelList,
  LoadingBox,
  MsgBox,
  ResourceKebab,
  ResourceSummary,
  SectionHeading,
  StatusBox,
  Timestamp,
  navFactory,
} from '@console/internal/components/utils';
import { connectToModel } from '@console/internal/kinds';
import {
  GroupVersionKind,
  K8sKind,
  K8sResourceCondition,
  K8sResourceKind,
  K8sResourceKindReference,
  OwnerReference,
  apiGroupForReference,
  apiVersionForReference,
  kindForReference,
  modelFor,
  referenceFor,
  referenceForModel,
  nameForModel,
  CustomResourceDefinitionKind,
  definitionFor,
} from '@console/internal/module/k8s';
import { ResourceEventStream } from '@console/internal/components/events';
import { deleteModal } from '@console/internal/components/modals';
import { RootState } from '@console/internal/redux';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind } from '../../types';
import { isInternalObject, getInternalAPIReferences, getInternalObjects } from '../../utils';
import { DescriptorType, StatusCapability, StatusDescriptor } from '../descriptors/types';
import { Resources } from '../k8s-resource';
import { referenceForProvidedAPI } from '../index';
import { OperandLink } from './operand-link';
import ErrorAlert from '@console/shared/src/components/alerts/error';
import {
  ClusterServiceVersionAction,
  useExtensions,
  isClusterServiceVersionAction,
} from '@console/plugin-sdk';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { DescriptorDetailsItem, DescriptorDetailsItemList } from '../descriptors';

const csvName = () =>
  window.location.pathname
    .split('/')
    .find(
      (part, i, allParts) =>
        allParts[i - 1] === referenceForModel(ClusterServiceVersionModel) ||
        allParts[i - 1] === ClusterServiceVersionModel.plural,
    );

const getActions = (
  ref: K8sResourceKindReference,
  actionExtensions: ClusterServiceVersionAction[],
) => {
  const actions = actionExtensions.filter(
    (action) =>
      action.properties.kind === kindForReference(ref) &&
      apiGroupForReference(ref) === action.properties.apiGroup,
  );
  const pluginActions = actions.map((action) => (kind, ocsObj) => ({
    label: action.properties.label,
    callback: action.properties.callback(kind, ocsObj),
  }));
  return [
    ...pluginActions,
    (kind, obj) => {
      const reference = referenceFor(obj);
      const href = kind.namespaced
        ? `/k8s/ns/${obj.metadata.namespace}/${
            ClusterServiceVersionModel.plural
          }/${csvName()}/${reference}/${obj.metadata.name}/yaml`
        : `/k8s/cluster/${reference}/${obj.metadata.name}/yaml`;
      return {
        label: `Edit ${kind.label}`,
        href,
        accessReview: {
          group: kind.apiGroup,
          resource: kind.plural,
          name: obj.metadata.name,
          namespace: obj.metadata.namespace,
          verb: 'update',
        },
      };
    },

    (kind, obj) => ({
      label: `Delete ${kind.label}`,
      callback: () =>
        deleteModal({
          kind,
          resource: obj,
          namespace: obj.metadata.namespace,
          redirectTo: `/k8s/ns/${obj.metadata.namespace}/${
            ClusterServiceVersionModel.plural
          }/${csvName()}/${referenceFor(obj)}`,
        }),
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        namespace: obj.metadata.namespace,
        verb: 'delete',
      },
    }),
  ] as KebabAction[];
};

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'),
  Kebab.columnClass,
];

export const OperandTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Kind',
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortFunc: 'operandStatus',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Last Updated',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

type OperandStatusType = {
  type: string;
  value: string;
};

const getOperandStatus = (obj: K8sResourceKind): OperandStatusType => {
  const { phase, status, state, conditions } = obj?.status || {};

  if (phase && _.isString(phase)) {
    return {
      type: 'Phase',
      value: phase,
    };
  }

  if (status && _.isString(status)) {
    return {
      type: 'Status',
      value: status,
    };
  }

  if (state && _.isString(state)) {
    return {
      type: 'State',
      value: state,
    };
  }

  const trueConditions = conditions?.filter((c: K8sResourceCondition) => c.status === 'True');
  if (trueConditions?.length) {
    const types = trueConditions.map((c: K8sResourceCondition) => c.type);
    return {
      type: types.length === 1 ? 'Condition' : 'Conditions',
      value: types.join(', '),
    };
  }

  return null;
};

export const OperandStatus: React.FunctionComponent<OperandStatusProps> = ({ operand }) => {
  const status: OperandStatusType = getOperandStatus(operand);
  if (!status) {
    return <>-</>;
  }

  const { type, value } = status;
  return (
    <span className="co-icon-and-text">
      {type}:&nbsp;
      {value === 'Running' ? <SuccessStatus title={value} /> : <Status status={value} />}
    </span>
  );
};

const getOperandStatusText = (operand: K8sResourceKind) => {
  const status = getOperandStatus(operand);
  return status ? `${status.type}: ${status.value}` : '';
};

export const OperandTableRow: React.FC<OperandTableRowProps> = ({ obj, index, rowKey, style }) => {
  const actionExtensions = useExtensions<ClusterServiceVersionAction>(
    isClusterServiceVersionAction,
  );
  const objReference = referenceFor(obj);
  const actions = React.useMemo(() => getActions(objReference, actionExtensions), [
    objReference,
    actionExtensions,
  ]);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={rowKey} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <OperandLink obj={obj} />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        data-test-operand-kind={obj.kind}
      >
        {obj.kind}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <OperandStatus operand={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={obj.kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={actions} kind={referenceFor(obj)} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export const OperandList: React.FC<OperandListProps> = (props) => {
  const Row = React.useCallback(
    (rowArgs: RowFunctionArgs<K8sResourceKind>) => (
      <OperandTableRow
        obj={rowArgs.obj}
        index={rowArgs.index}
        rowKey={rowArgs.key}
        style={rowArgs.style}
      />
    ),
    [],
  );
  const ensureKind = (data: K8sResourceKind[]) =>
    data.map((obj) => {
      if (obj.apiVersion && obj.kind) {
        return obj;
      }
      const reference = props.kinds[0];
      return {
        apiVersion: apiVersionForReference(reference),
        kind: kindForReference(reference),
        ...obj,
      };
    });
  const EmptyMsg = () => (
    <MsgBox
      title="No Operands Found"
      detail="Operands are declarative components used to define the behavior of the application."
    />
  );

  return (
    <Table
      {...props}
      customSorts={{
        operandStatus: getOperandStatusText,
      }}
      data={ensureKind(props.data)}
      EmptyMsg={EmptyMsg}
      aria-label="Operands"
      Header={OperandTableHeader}
      Row={Row}
      virtualize
    />
  );
};

const inFlightStateToProps = ({ k8s }: RootState) => ({
  inFlight: k8s.getIn(['RESOURCES', 'inFlight']),
});

export const ProvidedAPIsPage = connect(inFlightStateToProps)((props: ProvidedAPIsPageProps) => {
  const { obj } = props;
  const { owned = [] } = obj.spec.customresourcedefinitions;
  const internalObjects = getInternalObjects(obj);
  const internalAPIs = getInternalAPIReferences(obj);
  const firehoseResources = owned.reduce((resources, desc) => {
    const reference = referenceForProvidedAPI(desc);
    const model = modelFor(reference);
    return model && !internalAPIs.some((api) => api === reference)
      ? [
          ...resources,
          {
            kind: referenceForProvidedAPI(desc),
            namespaced: model.namespaced,
            prop: desc.kind,
          },
        ]
      : resources;
  }, []);

  const EmptyMsg = () => (
    <MsgBox
      title="No Provided APIs Defined"
      detail="This application was not properly installed or configured."
    />
  );
  const createLink = (name: string) =>
    `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${
      obj.metadata.name
    }/${referenceForProvidedAPI(_.find(owned, { name }))}/~new`;
  const createProps =
    owned.length > 1
      ? {
          items: owned.reduce(
            (acc, crd) =>
              !isInternalObject(internalObjects, crd.name)
                ? { ...acc, [crd.name]: crd.displayName }
                : acc,
            {},
          ),
          createLink,
        }
      : { to: owned.length === 1 ? createLink(owned[0].name) : null };

  const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) =>
    ownerRefs.filter(({ uid }) => items.filter(({ metadata }) => metadata.uid === uid).length > 0);
  const flatten = (resources: { [kind: string]: { data: K8sResourceKind[] } }) =>
    _.flatMap(resources, (resource) => _.map(resource.data, (item) => item)).filter(
      ({ kind, metadata }, i, allResources) =>
        owned.filter((item) => item.kind === kind).length > 0 ||
        owners(metadata.ownerReferences || [], allResources).length > 0,
    );

  const rowFilters = [
    {
      filterGroupName: 'Resource Kind',
      type: 'clusterserviceversion-resource-kind',
      reducer: ({ kind }) => kind,
      items: firehoseResources.map(({ kind }) => ({
        id: kindForReference(kind),
        title: kindForReference(kind),
      })),
    },
  ];

  if (props.inFlight) {
    return null;
  }

  return firehoseResources.length > 0 ? (
    <MultiListPage
      {...props}
      ListComponent={OperandList}
      filterLabel="Resources by name"
      resources={firehoseResources}
      namespace={obj.metadata.namespace}
      canCreate={owned.length > 0}
      createProps={createProps}
      createButtonText={owned.length > 1 ? 'Create New' : `Create ${owned[0].displayName}`}
      flatten={flatten}
      rowFilters={firehoseResources.length > 1 ? rowFilters : null}
    />
  ) : (
    <StatusBox loaded EmptyMsg={EmptyMsg} />
  );
});

export const ProvidedAPIPage = connectToModel((props: ProvidedAPIPageProps) => {
  const { namespace, kind, kindsInFlight, kindObj, csv } = props;

  if (!kindObj) {
    return kindsInFlight ? (
      <LoadingBox />
    ) : (
      <ErrorPage404
        message={`The server doesn't have a resource type ${kindForReference(
          kind,
        )}. Try refreshing the page if it was recently added.`}
      />
    );
  }

  const to = `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${kind}/~new`;
  return (
    <ListPage
      kind={kind}
      ListComponent={OperandList}
      canCreate={_.get(kindObj, 'verbs', [] as string[]).some((v) => v === 'create')}
      createProps={{ to }}
      namespace={kindObj.namespaced ? namespace : null}
    />
  );
});

const OperandDetailsSection: React.FC = ({ children }) => (
  <div className="co-operand-details__section co-operand-details__section--info">{children}</div>
);

const PodStatuses: React.FC<PodStatusesProps> = ({ kindObj, obj, podStatusDescriptors, schema }) =>
  podStatusDescriptors?.length > 0 ? (
    <div className="row">
      {podStatusDescriptors.map((statusDescriptor: StatusDescriptor) => {
        return (
          <div key={statusDescriptor.displayName} className="col-sm-6">
            <DescriptorDetailsItem
              type={DescriptorType.status}
              descriptor={statusDescriptor}
              model={kindObj}
              obj={obj}
              schema={schema}
            />
          </div>
        );
      })}
    </div>
  ) : null;

export const OperandDetails = connectToModel(({ crd, csv, kindObj, obj }: OperandDetailsProps) => {
  const { kind, status } = obj;
  const [errorMessage, setErrorMessage] = React.useState(null);
  const handleError = (err: Error) => setErrorMessage(err.message);
  const schema = crd?.spec?.validation?.openAPIV3Schema ?? (definitionFor(kindObj) as JSONSchema6);
  const specSchema = schema?.properties?.spec as JSONSchema6;
  const statusSchema = schema?.properties?.status as JSONSchema6;

  // Find the matching CRD spec for the kind of this resource in the CSV.
  const { displayName, specDescriptors, statusDescriptors } =
    [
      ...(csv?.spec?.customresourcedefinitions?.owned ?? []),
      ...(csv?.spec?.customresourcedefinitions?.required ?? []),
    ].find((def) => def.name === crd?.metadata?.name) ?? {};

  const { podStatuses, mainStatusDescriptor, otherStatusDescriptors } = (
    statusDescriptors ?? []
  ).reduce((acc, descriptor) => {
    // exclude Conditions since they are included in their own section
    if (descriptor.path === 'conditions') {
      return acc;
    }

    if (descriptor['x-descriptors']?.includes(StatusCapability.podStatuses)) {
      return {
        ...acc,
        podStatuses: [...(acc.PodStatuses ?? []), descriptor],
      };
    }

    if (descriptor.path === 'status' || descriptor.displayName === 'Status') {
      return {
        ...acc,
        mainStatusDescriptor: descriptor,
      };
    }

    return {
      ...acc,
      otherStatusDescriptors: [...(acc.otherStatusDescriptors ?? []), descriptor],
    };
  }, {} as any);

  return (
    <div className="co-operand-details co-m-pane">
      <div className="co-m-pane__body">
        {errorMessage && <ErrorAlert message={errorMessage} />}
        <SectionHeading text={`${displayName || kind} Overview`} />
        <PodStatuses
          kindObj={kindObj}
          obj={obj}
          schema={statusSchema}
          podStatusDescriptors={podStatuses}
        />
        <div className="co-operand-details__section co-operand-details__section--info">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} />
            </div>
            {mainStatusDescriptor && (
              <div className="col-sm-6" key={mainStatusDescriptor.path}>
                <DescriptorDetailsItem
                  descriptor={mainStatusDescriptor}
                  model={kindObj}
                  obj={obj}
                  schema={statusSchema}
                  type={DescriptorType.status}
                />
              </div>
            )}
            {otherStatusDescriptors?.length > 0 && (
              <DescriptorDetailsItemList
                descriptors={otherStatusDescriptors}
                itemClassName="col-sm-6"
                model={kindObj}
                obj={obj}
                schema={statusSchema}
                type={DescriptorType.status}
              />
            )}
          </div>
        </div>
      </div>
      {!_.isEmpty(specDescriptors) && (
        <div className="co-m-pane__body">
          <div className="co-operand-details__section co-operand-details__section--info">
            <div className="row">
              <DescriptorDetailsItemList
                descriptors={specDescriptors}
                itemClassName="col-sm-6"
                model={kindObj}
                obj={obj}
                onError={handleError}
                schema={specSchema}
                type={DescriptorType.spec}
              />
            </div>
          </div>
        </div>
      )}
      {_.isArray(status?.conditions) && (
        <div className="co-m-pane__body">
          <SectionHeading text="Conditions" />
          <Conditions conditions={status.conditions} />
        </div>
      )}
    </div>
  );
});

const ResourcesTab = (resourceProps) => (
  <Resources {...resourceProps} clusterServiceVersion={resourceProps.csv} />
);

export const OperandDetailsPage = (props: OperandDetailsPageProps) => {
  const [model] = useK8sModel(props.match.params.plural);
  const actionExtensions = useExtensions<ClusterServiceVersionAction>(
    isClusterServiceVersionAction,
  );
  const menuActions = React.useMemo(() => getActions(props.match.params.plural, actionExtensions), [
    props.match.params.plural,
    actionExtensions,
  ]);
  return (
    <DetailsPage
      match={props.match}
      name={props.match.params.name}
      kind={props.match.params.plural}
      namespace={props.match.params.ns}
      resources={[
        {
          kind: referenceForModel(ClusterServiceVersionModel),
          name: props.match.params.appName,
          namespace: props.match.params.ns,
          isList: false,
          prop: 'csv',
        },
        {
          kind: CustomResourceDefinitionModel.kind,
          name: nameForModel(model),
          isList: false,
          prop: 'crd',
        },
      ]}
      menuActions={menuActions}
      breadcrumbsFor={() => [
        {
          name: 'Installed Operators',
          path: `/k8s/ns/${props.match.params.ns}/${ClusterServiceVersionModel.plural}`,
        },
        {
          name: props.match.params.appName,
          path: props.match.url.slice(0, props.match.url.lastIndexOf('/')),
        },
        {
          name: `${kindForReference(props.match.params.plural)} Details`, // Use url param in case model doesn't exist
          path: `${props.match.url}`,
        },
      ]}
      pages={[
        navFactory.details((detailsProps) => (
          <OperandDetails {...detailsProps} appName={props.match.params.appName} />
        )),
        navFactory.editYaml(),
        {
          name: 'Resources',
          href: 'resources',
          component: ResourcesTab,
        },
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};

export type OperandListProps = {
  loaded: boolean;
  kinds?: GroupVersionKind[];
  data: K8sResourceKind[];
  filters: { [key: string]: any };
  reduxID?: string;
  reduxIDs?: string[];
  rowSplitter?: any;
  staticFilters?: any;
};

export type OperandStatusProps = {
  operand: K8sResourceKind;
};

export type OperandHeaderProps = {
  data: K8sResourceKind[];
};

export type OperandRowProps = {
  obj: K8sResourceKind;
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

type PodStatusesProps = {
  kindObj: K8sKind;
  obj: K8sResourceKind;
  podStatusDescriptors: StatusDescriptor[];
  schema?: JSONSchema6;
};

export type OperandDetailsProps = {
  obj: K8sResourceKind;
  appName: string;
  kindObj: K8sKind;
  csv: ClusterServiceVersionKind;
  crd: CustomResourceDefinitionKind;
};

export type OperandDetailsPageProps = {
  match: match<{
    name: string;
    ns: string;
    appName: string;
    plural: string;
  }>;
};

export type OperandesourceDetailsProps = {
  csv?: { data: ClusterServiceVersionKind };
  gvk: GroupVersionKind;
  name: string;
  namespace: string;
  match: match<{ appName: string }>;
};

export type OperandTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  rowKey: string;
  style: object;
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
OperandList.displayName = 'OperandList';
OperandDetails.displayName = 'OperandDetails';
OperandList.displayName = 'OperandList';
ProvidedAPIsPage.displayName = 'ProvidedAPIsPage';
OperandDetailsPage.displayName = 'OperandDetailsPage';
OperandTableRow.displayName = 'OperandTableRow';
OperandTableHeader.displayName = 'OperandTableHeader';
OperandDetailsSection.displayName = 'OperandDetailsSection';
PodStatuses.displayName = 'PodStatuses';
