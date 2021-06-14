import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { JSONSchema6 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router-dom';
import { Conditions } from '@console/internal/components/conditions';
import { ErrorPage404 } from '@console/internal/components/error';
import { ResourceEventStream } from '@console/internal/components/events';
import {
  MultiListPage,
  ListPage,
  DetailsPage,
  Table,
  TableRow,
  TableData,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { deleteModal } from '@console/internal/components/modals';
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
import { CustomResourceDefinitionModel } from '@console/internal/models';
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
  referenceFor,
  referenceForModel,
  nameForModel,
  CustomResourceDefinitionKind,
  definitionFor,
} from '@console/internal/module/k8s';
import {
  ClusterServiceVersionAction,
  useExtensions,
  isClusterServiceVersionAction,
} from '@console/plugin-sdk';
import { Status, SuccessStatus, getBadgeFromType } from '@console/shared';
import ErrorAlert from '@console/shared/src/components/alerts/error';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useK8sModels } from '@console/shared/src/hooks/useK8sModels';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind } from '../../types';
import { DescriptorDetailsItem, DescriptorDetailsItemList } from '../descriptors';
import { DescriptorConditions } from '../descriptors/status/conditions';
import { DescriptorType, StatusCapability, StatusDescriptor } from '../descriptors/types';
import { isMainStatusDescriptor } from '../descriptors/utils';
import { providedAPIsForCSV, referenceForProvidedAPI } from '../index';
import { Resources } from '../k8s-resource';
import { csvNameFromWindow, OperandLink } from './operand-link';

export const getOperandActions = (
  ref: K8sResourceKindReference,
  actionExtensions: ClusterServiceVersionAction[],
  csvName?: string,
) => {
  const actions = actionExtensions.filter(
    (action) =>
      action.properties.kind === kindForReference(ref) &&
      apiGroupForReference(ref) === action.properties.apiGroup,
  );
  const pluginActions = actions.reduce((acc, action) => {
    acc[action.properties.id] = (kind, ocsObj) => ({
      label: action.properties.label,
      callback: action.properties.callback(kind, ocsObj),
      hidden:
        typeof action.properties?.hidden === 'function'
          ? action.properties?.hidden(kind, ocsObj)
          : action.properties?.hidden,
    });
    return acc;
  }, {});
  const defaultActions = {
    edit: (kind, obj) => {
      const reference = referenceFor(obj);
      const href = kind.namespaced
        ? `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csvName ||
            csvNameFromWindow()}/${reference}/${obj.metadata.name}/yaml`
        : `/k8s/cluster/${reference}/${obj.metadata.name}/yaml`;
      return {
        // t('olm~Edit {{item}}')
        labelKey: 'olm~Edit {{item}}',
        labelKind: { item: kind.label },
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
    delete: (kind, obj) => ({
      // t('olm~Delete {{item}}')
      labelKey: 'olm~Delete {{item}}',
      labelKind: { item: kind.label },
      callback: () =>
        deleteModal({
          kind,
          resource: obj,
          namespace: obj.metadata.namespace,
          redirectTo: `/k8s/ns/${obj.metadata.namespace}/${
            ClusterServiceVersionModel.plural
          }/${csvName || csvNameFromWindow()}/${referenceFor(obj)}`,
        }),
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        namespace: obj.metadata.namespace,
        verb: 'delete',
      },
    }),
  };
  // In order to keep plugin properties on top
  const overridenProperties = Object.assign(
    defaultActions,
    _.pick(pluginActions, Object.keys(defaultActions)),
  );
  const mergedActions = Object.assign({}, pluginActions, overridenProperties);
  return Object.values(mergedActions) as KebabAction[];
};

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'),
  Kebab.columnClass,
];

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

export const OperandStatus: React.FC<OperandStatusProps> = ({ operand }) => {
  const status: OperandStatusType = getOperandStatus(operand);
  if (!status) {
    return <>-</>;
  }

  const { type, value } = status;
  return (
    <span className="co-icon-and-text">
      {type}: {value === 'Running' ? <SuccessStatus title={value} /> : <Status status={value} />}
    </span>
  );
};

const getOperandStatusText = (operand: K8sResourceKind): string => {
  const status = getOperandStatus(operand);
  return status ? `${status.type}: ${status.value}` : '';
};

export const OperandTableRow: React.FC<OperandTableRowProps> = ({ obj, index, rowKey, style }) => {
  const actionExtensions = useExtensions<ClusterServiceVersionAction>(
    isClusterServiceVersionAction,
  );
  const objReference = referenceFor(obj);
  const actions = React.useMemo(() => getOperandActions(objReference, actionExtensions), [
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
  const { t } = useTranslation();
  const Header = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Kind'),
        sortField: 'kind',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Status'),
        sortFunc: 'operandStatus',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Last updated'),
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
  const data = React.useMemo(
    () =>
      props.data?.map?.((obj) => {
        if (obj.apiVersion && obj.kind) {
          return obj;
        }
        const reference = props.kinds[0];
        return {
          apiVersion: apiVersionForReference(reference),
          kind: kindForReference(reference),
          ...obj,
        };
      }) ?? [],
    [props.data, props.kinds],
  );
  const EmptyMsg = () => (
    <MsgBox
      title={t('olm~No operands found')}
      detail={t(
        'olm~Operands are declarative components used to define the behavior of the application.',
      )}
    />
  );

  return (
    <Table
      {...props}
      customSorts={{
        operandStatus: getOperandStatusText,
      }}
      data={data}
      EmptyMsg={EmptyMsg}
      aria-label="Operands"
      Header={Header}
      Row={Row}
      virtualize
    />
  );
};

export const ProvidedAPIsPage = (props: ProvidedAPIsPageProps) => {
  const { t } = useTranslation();
  const { obj } = props;
  const [models, inFlight] = useK8sModels();
  if (inFlight) {
    return null;
  }
  const providedAPIs = providedAPIsForCSV(obj);

  // Exclude provided APIs that do not have a model
  const firehoseResources = providedAPIs.reduce((resourceAccumulator, api) => {
    const reference = referenceForProvidedAPI(api);
    const model = models?.[reference];
    return model
      ? [
          ...resourceAccumulator,
          {
            kind: referenceForProvidedAPI(api),
            namespaced: model.namespaced,
            prop: api.kind,
          },
        ]
      : resourceAccumulator;
  }, []);

  const EmptyMsg = () => (
    <MsgBox
      title={t('olm~No provided APIs defined')}
      detail={t('olm~This application was not properly installed or configured.')}
    />
  );
  const createLink = (name: string) =>
    `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${
      obj.metadata.name
    }/${referenceForProvidedAPI(_.find(providedAPIs, { name }))}/~new`;
  const createProps =
    providedAPIs.length > 1
      ? {
          items: providedAPIs.reduce((acc, api) => ({ ...acc, [api.name]: api.displayName }), {}),
          createLink,
        }
      : { to: providedAPIs.length === 1 ? createLink(providedAPIs[0].name) : null };

  const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) =>
    ownerRefs.filter(({ uid }) => items.filter(({ metadata }) => metadata.uid === uid).length > 0);
  const flatten = (resources: { [kind: string]: { data: K8sResourceKind[] } }) =>
    _.flatMap(resources, (resource) => _.map(resource.data, (item) => item)).filter(
      ({ kind, metadata }, i, allResources) =>
        providedAPIs.filter((item) => item.kind === kind).length > 0 ||
        owners(metadata.ownerReferences || [], allResources).length > 0,
    );

  const rowFilters =
    firehoseResources.length > 1
      ? [
          {
            filterGroupName: 'Resource Kind',
            type: 'clusterserviceversion-resource-kind',
            reducer: ({ kind }) => kind,
            items: firehoseResources.map(({ kind }) => ({
              id: kindForReference(kind),
              title: kindForReference(kind),
            })),
          },
        ]
      : [];

  return firehoseResources.length > 0 ? (
    <MultiListPage
      {...props}
      ListComponent={OperandList}
      filterLabel={t('olm~Resources by name')}
      resources={firehoseResources}
      namespace={obj.metadata.namespace}
      canCreate={providedAPIs.length > 0}
      createProps={createProps}
      createButtonText={
        providedAPIs.length > 1
          ? t('olm~Create new')
          : t('olm~Create {{item}}', {
              item: providedAPIs[0].displayName,
            })
      }
      flatten={flatten}
      rowFilters={rowFilters}
    />
  ) : (
    <StatusBox loaded EmptyMsg={EmptyMsg} />
  );
};

export const ProvidedAPIPage = connectToModel((props: ProvidedAPIPageProps) => {
  const { t } = useTranslation();
  const { namespace, kind, kindsInFlight, kindObj, csv } = props;
  if (!kindObj) {
    return kindsInFlight ? (
      <LoadingBox />
    ) : (
      <ErrorPage404
        message={t(
          "olm~The server doesn't have a resource type {{kind}}. Try refreshing the page if it was recently added.",
          { kind: kindForReference(kind) },
        )}
      />
    );
  }

  const to = `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${kind}/~new`;
  return (
    <ListPage
      kind={kind}
      ListComponent={OperandList}
      canCreate={kindObj?.verbs?.includes('create')}
      createProps={{ to }}
      namespace={kindObj.namespaced ? namespace : null}
      badge={getBadgeFromType(kindObj.badge)}
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
  const { t } = useTranslation();
  const { kind, status } = obj;
  const [errorMessage, setErrorMessage] = React.useState(null);
  const handleError = (err: Error) => setErrorMessage(err.message);

  // Find the matching CRD spec for the kind of this resource in the CSV.
  const { displayName, specDescriptors, statusDescriptors, version } =
    [
      ...(csv?.spec?.customresourcedefinitions?.owned ?? []),
      ...(csv?.spec?.customresourcedefinitions?.required ?? []),
    ].find((def) => def.name === crd?.metadata?.name) ?? {};

  const schema =
    crd?.spec?.versions?.find((v) => v.name === version)?.schema?.openAPIV3Schema ??
    (definitionFor(kindObj) as JSONSchema6);

  const {
    podStatuses,
    mainStatusDescriptor,
    conditionsStatusDescriptors,
    otherStatusDescriptors,
  } = (statusDescriptors ?? []).reduce((acc, descriptor) => {
    // exclude Conditions since they are included in their own section
    if (descriptor.path === 'conditions') {
      return acc;
    }

    if (descriptor['x-descriptors']?.includes(StatusCapability.podStatuses)) {
      return {
        ...acc,
        podStatuses: [...(acc.podStatuses ?? []), descriptor],
      };
    }

    if (isMainStatusDescriptor(descriptor)) {
      return {
        ...acc,
        mainStatusDescriptor: descriptor,
      };
    }

    if (descriptor['x-descriptors']?.includes(StatusCapability.conditions)) {
      return {
        ...acc,
        conditionsStatusDescriptors: [...(acc.conditionsStatusDescriptors ?? []), descriptor],
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
        <SectionHeading text={t('olm~{{kind}} overview', { kind: displayName || kind })} />
        <PodStatuses
          kindObj={kindObj}
          obj={obj}
          schema={schema}
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
                  schema={schema}
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
                schema={schema}
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
                schema={schema}
                type={DescriptorType.spec}
              />
            </div>
          </div>
        </div>
      )}
      {_.isArray(status?.conditions) && (
        <div className="co-m-pane__body" data-test="status.conditions">
          <SectionHeading data-test="operand-conditions-heading" text={t('public~Conditions')} />
          <Conditions conditions={status.conditions} />
        </div>
      )}
      {conditionsStatusDescriptors?.length > 0 &&
        conditionsStatusDescriptors.map((descriptor) => (
          <DescriptorConditions descriptor={descriptor} schema={schema} obj={obj} />
        ))}
    </div>
  );
});

const ResourcesTab = (resourceProps) => (
  <Resources {...resourceProps} clusterServiceVersion={resourceProps.csv} />
);

export const OperandDetailsPage = (props: OperandDetailsPageProps) => {
  const { t } = useTranslation();
  const [model] = useK8sModel(props.match.params.plural);
  const actionExtensions = useExtensions<ClusterServiceVersionAction>(
    isClusterServiceVersionAction,
  );
  const menuActions = React.useMemo(
    () => getOperandActions(props.match.params.plural, actionExtensions),
    [props.match.params.plural, actionExtensions],
  );
  return model ? (
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
          name: t('olm~Installed Operators'),
          path: `/k8s/ns/${props.match.params.ns}/${ClusterServiceVersionModel.plural}`,
        },
        {
          name: props.match.params.appName,
          path: props.match.url.slice(0, props.match.url.lastIndexOf('/')),
        },
        {
          name: t('olm~{{item}} details', { item: kindForReference(props.match.params.plural) }), // Use url param in case model doesn't exist
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
  ) : (
    <ErrorPage404 />
  );
};

type OperandStatusType = {
  type: string;
  value: string;
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
OperandDetailsSection.displayName = 'OperandDetailsSection';
PodStatuses.displayName = 'PodStatuses';
