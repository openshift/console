import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  MultiListPage,
  Table,
  TableData,
  Flatten,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import {
  ResourceLink,
  Timestamp,
  MsgBox,
  FirehoseResource,
} from '@console/internal/components/utils';
import {
  ConfigMapModel,
  DeploymentModel,
  JobModel,
  PodModel,
  ReplicaSetModel,
  SecretModel,
  ServiceModel,
} from '@console/internal/models';
import {
  K8sResourceKind,
  kindForReference,
  modelFor,
  referenceForGroupVersionKind,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { CRDDescription, ClusterServiceVersionKind, ProvidedAPI } from '../types';
import { OperandLink } from './operand/operand-link';
import { providedAPIForReference } from './index';

const DEFAULT_RESOURCES: CRDDescription['resources'] = [
  { kind: DeploymentModel.kind, version: DeploymentModel.apiVersion },
  { kind: ServiceModel.kind, version: ServiceModel.apiVersion },
  { kind: ReplicaSetModel.kind, version: ReplicaSetModel.apiVersion },
  { kind: PodModel.kind, version: PodModel.apiVersion },
  { kind: SecretModel.kind, version: SecretModel.apiVersion },
  { kind: ConfigMapModel.kind, version: ConfigMapModel.apiVersion },
  { kind: JobModel.kind, version: JobModel.apiVersion },
];

const tableColumnClasses = [
  '',
  'pf-u-w-16-on-md',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-16-on-lg',
  'pf-m-hidden pf-m-visible-on-sm',
];

export const ResourceTableRow: React.FC<RowFunctionArgs<
  K8sResourceKind,
  {
    linkFor: (obj: K8sResourceKind, providedAPI: ProvidedAPI) => JSX.Element;
    providedAPI: ProvidedAPI;
  }
>> = ({ obj, customData: { linkFor, providedAPI } }) => (
  <>
    <TableData className={tableColumnClasses[0]}>{linkFor(obj, providedAPI)}</TableData>
    <TableData className={tableColumnClasses[1]}>{obj.kind}</TableData>
    <TableData className={tableColumnClasses[2]}>
      <Status status={obj?.status?.phase ?? 'Created'} />
    </TableData>
    <TableData className={tableColumnClasses[3]}>
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </TableData>
  </>
);

export const ResourceTable: React.FC<ResourceTableProps> = (props) => {
  const { t } = useTranslation();
  const ResourceTableHeader = () => [
    {
      title: t('olm~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('olm~Kind'),
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('olm~Status'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('olm~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={t('olm~Operand Resources')}
      Header={ResourceTableHeader}
      Row={ResourceTableRow}
      EmptyMsg={() => (
        <MsgBox
          title={t('olm~No resources found')}
          detail={t('olm~There are no Kubernetes resources used by this operand.')}
        />
      )}
      virtualize
    />
  );
};

export const flattenCsvResources = (
  parentObj: K8sResourceCommon,
): Flatten<{ [key: string]: K8sResourceCommon[] }, K8sResourceCommon[]> => (resources) => {
  return _.flatMap(resources, (resource, kind: string) =>
    _.map(resource.data, (item) => ({ ...item, kind })),
  ).reduce((owned, resource) => {
    return (resource.metadata.ownerReferences || []).some(
      (ref) =>
        ref.uid === parentObj.metadata.uid ||
        owned.some(({ metadata }) => metadata.uid === ref.uid),
    )
      ? owned.concat([resource])
      : owned;
  }, []);
};

// NOTE: This is us building the `ownerReferences` graph client-side
// FIXME: Comparing `kind` is not enough to determine if an object is a custom resource
export const linkForCsvResource = (
  obj: K8sResourceKind,
  providedAPI: ProvidedAPI,
  csvName?: string,
) =>
  obj.metadata.namespace &&
  (providedAPI?.resources ?? []).some(({ kind, name }) => name && kind === obj.kind) ? (
    <OperandLink obj={obj} csvName={csvName} />
  ) : (
    <ResourceLink kind={obj.kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
  );

export const Resources: React.FC<ResourcesProps> = (props) => {
  const { t } = useTranslation();
  const { plural } = useParams();
  const providedAPI = providedAPIForReference(props.csv, plural);

  const firehoseResources = (providedAPI?.resources ?? DEFAULT_RESOURCES).map(
    ({ name, kind, version }): FirehoseResource => {
      const group = name ? name.substring(name.indexOf('.') + 1) : '';
      const reference = group ? referenceForGroupVersionKind(group)(version)(kind) : kind;
      const model = modelFor(reference);
      return {
        kind: model && !model.crd ? kind : reference,
        namespaced: model ? model.namespaced : true,
        prop: kind,
      };
    },
  );

  const customData = React.useMemo(
    () => ({
      linkFor: linkForCsvResource,
      providedAPI,
    }),
    [providedAPI],
  );

  return (
    <MultiListPage
      filterLabel={t('olm~Resources by name')}
      resources={firehoseResources}
      rowFilters={[
        {
          type: 'clusterserviceversion-resource-kind',
          filterGroupName: t('olm~Kind'),
          reducer: ({ kind }) => kindForReference(kind),
          items: firehoseResources.map(({ kind }) => ({
            id: kindForReference(kind),
            title: kindForReference(kind),
          })),
        },
      ]}
      flatten={flattenCsvResources(props.obj)}
      namespace={props.obj.metadata.namespace}
      ListComponent={ResourceTable}
      customData={customData}
    />
  );
};

export type ResourcesProps = {
  obj: K8sResourceKind;
  csv: ClusterServiceVersionKind;
};

export type ResourceListProps = {};

export type ResourceTableProps = {
  loaded: boolean;
  loadError?: string;
  data: K8sResourceKind[];
  linkFor: (obj: K8sResourceKind, providedAPI: ProvidedAPI) => JSX.Element;
  providedAPI: ProvidedAPI;
};

ResourceTable.displayName = 'ResourceTable';
Resources.displayName = 'Resources';
