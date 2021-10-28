import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
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
  GroupVersionKind,
  kindForReference,
  modelFor,
  referenceForGroupVersionKind,
  K8sResourceCommon,
  referenceForModel,
  K8sKind,
  referenceFor,
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

const useProvidedAPIResourceModels = (providedAPI): K8sKind[] => {
  // eslint-disable-next-line no-console
  console.log('KKKD providedAPI', providedAPI?.resources);
  return (providedAPI?.resources ?? DEFAULT_RESOURCES).map(({ name, kind, version }) => {
    const group = name ? name.substring(name.indexOf('.') + 1) : '';
    const reference = group ? referenceForGroupVersionKind(group)(version)(kind) : kind;
    const model = modelFor(reference);
    /*
    For providedAPI entry: 
     {kind: 'ChronTab', name: '', version: 'v1'} // AKA a crd

     model is undefined - which breaks things further down in the process.
     
     The modelFor method says to use `connectToModels` instead.

    */
    // eslint-disable-next-line no-console
    console.log('KKKD starting loop - model', model);
    return model;
  });
};

const tableColumnClasses = [
  '',
  'pf-u-w-16-on-md',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-16-on-lg',
  'pf-m-hidden pf-m-visible-on-sm',
];

export const ResourceTableRow: React.FC<RowFunctionArgs<
  K8sResourceKind,
  {
    linkFor: (obj: K8sResourceKind) => JSX.Element;
  }
>> = ({ obj, customData: { linkFor } }) => (
  <>
    <TableData className={tableColumnClasses[0]}>{linkFor(obj)}</TableData>
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

// NOTE: This is us building the `ownerReferences` graph client-side
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

export const linkForCsvResource = (obj: K8sResourceKind, models?: K8sKind[]) => {
  const groupVersionKind = referenceFor(obj);

  /* example data:
Obj: {
  apiVersion: "apps/v1"
kind: "Deployment"
metadata:
annotations:
deployment.kubernetes.io/revision: "1"
email: "support@stackrox.com"
meta.helm.sh/release-name: "stackrox-central-services"
meta.helm.sh/release-namespace: "kkd-test-project-1"
owner: "stackrox"
creationTimestamp: "2021-10-28T14:58:32Z"
generation: 1
labels: {app: 'scanner', app.kubernetes.io/component: 'scanner', app.kubernetes.io/instance: 'stackrox-central-services', app.kubernetes.io/managed-by: 'Helm', app.kubernetes.io/name: 'stackrox', …}
managedFields: (2) [{…}, {…}]
name: "scanner"
namespace: "kkd-test-project-1"
ownerReferences: [{…}]
resourceVersion: "38154"
uid: "623d8cd1-bee8-402f-8d4e-5b88b8deb15c"
spec: {replicas: 3, selector: {…}, template: {…}, strategy: {…}, minReadySeconds: 15, …}
status: {observedGeneration: 1, replicas: 3, updatedReplicas: 3, unavailableReplicas: 3, conditions: Array(2)}
}

groupVersionKind: apps~v1~Deployment

Model: [{"label":"Deployment","labelKey":"public~Deployment","apiVersion":"v1","apiGroup":"apps","plural":"deployments","abbr":"D","namespaced":true,"propagationPolicy":"Foreground","kind":"Deployment","id":"deployment","labelPlural":"Deployments","labelPluralKey":"public~Deployments"}]
  */
  // eslint-disable-next-line no-console
  console.log('KKKD Obj:', obj);
  // eslint-disable-next-line no-console
  console.log('KKKD groupVersionKind', groupVersionKind);
  // eslint-disable-next-line no-console
  console.log('KKKD models', models);

  // proposed solution:
  // return obj.metadata.namespace && models[groupVersionKind]?.crd ? (

  return obj.metadata.namespace && models.some((model) => obj.kind === model.kind && model.crd) ? (
    <OperandLink obj={obj} />
  ) : (
    <ResourceLink kind={obj.kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
  );
};

export const Resources: React.FC<ResourcesProps> = (props) => {
  const { t } = useTranslation();
  const providedAPI = providedAPIForReference(
    props.clusterServiceVersion,
    props.match.params.plural,
  );

  const providedAPIResourceModels = useProvidedAPIResourceModels(providedAPI);
  const firehoseResources = providedAPIResourceModels.map(
    (model): FirehoseResource => {
      return {
        kind: model && !model.crd ? model.kind : referenceForModel(model),
        namespaced: model ? model.namespaced : true,
        prop: model.kind,
      };
    },
  );

  const customData = React.useMemo(
    () => ({
      linkFor: (obj) => linkForCsvResource(obj, providedAPIResourceModels),
    }),
    [providedAPIResourceModels],
  );

  return (
    <MultiListPage
      filterLabel={t('olm~Resources by name')}
      resources={firehoseResources}
      rowFilters={[
        {
          type: 'clusterserviceversion-resource-kind',
          filterGroupName: 'Kind',
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
  clusterServiceVersion: ClusterServiceVersionKind;
  match: match<{ plural: GroupVersionKind; ns: string; appName: string; name: string }>;
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
