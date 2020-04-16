import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { match } from 'react-router';
import {
  Kebab,
  ResourceKebab,
  ResourceLink,
  FirehoseResult,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  MultiListPage,
  Table,
  TableData,
  TableRow,
  TableProps,
  RowFunction,
} from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { NooBaaBackingStoreModel, NooBaaBucketClassModel } from '../../models';

const kindsFilterMap = Object.freeze({
  BackingStore: {
    title: NooBaaBackingStoreModel.label,
    kind: [NooBaaBackingStoreModel.kind],
  },
  BucketClass: {
    title: NooBaaBucketClassModel.label,
    kind: [NooBaaBucketClassModel.kind],
  },
});

const resourceTableFilter: RowFilter = {
  filterGroupName: 'Type',
  type: 'noobaa-resources-type',
  reducer: (r) => r.kind,
  items: _.map(kindsFilterMap, ({ title }, id) => ({ id, title })),
  filter: (groups, resource) => {
    const { kind } = resource;
    return groups.selected.has(kind) || !_.includes(groups.all, kind) || _.isEmpty(groups.selected);
  },
};

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const ResourceTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Type',
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Created At',
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
ResourceTableHeader.displayName = 'ResourceTableHeader';

const getModelFromKind = (name: string) =>
  name === 'BucketClass' ? NooBaaBucketClassModel : NooBaaBackingStoreModel;

const ResourceTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(getModelFromKind(obj.kind))}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.uid}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind={referenceForModel(getModelFromKind(obj.kind))} name={obj.kind} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{obj.status.phase}</TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{obj.metadata.creationTimestamp}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={Kebab.factory.common}
          kind={referenceForModel(getModelFromKind(obj.kind))}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};

const getFireHoseResources = (namespace: string) => {
  const backingStore = {
    kind: referenceForModel(NooBaaBackingStoreModel),
    namespace,
    namespaced: true,
    prop: 'bs',
    isList: true,
  };
  const bucketClass = {
    kind: referenceForModel(NooBaaBucketClassModel),
    namespaced: true,
    namespace,
    prop: 'bc',
    isList: true,
  };
  return [backingStore, bucketClass];
};

const ListComponent: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="NooBaa Resources"
    Header={ResourceTableHeader}
    Row={ResourceTableRow}
    virtualize
  />
);

const flattenResources = (resources: Resource) => {
  const { bc, bs } = resources;
  const loaded = _.every(resources, (resource) => resource.loaded && _.isEmpty(resource.loadError));
  if (!loaded) return [];
  const bcData = !_.isEmpty(bc) ? bc.data : [];
  const bsData = !_.isEmpty(bs) ? bs.data : [];
  const data = bcData.concat(bsData);
  return data;
};

const getOperatorPathFromMatch = (matchObj: match) => {
  const { url } = matchObj;
  const parts = url.split('/');
  return parts.slice(0, -2).join('/');
};

const MCGResourceList: React.FC<MCGResourceListProps> = (props) => {
  const {
    customData: { namespace },
    match: matchObj,
  } = props;

  const operatorPath = getOperatorPathFromMatch(matchObj);

  const createItems = {
    [NooBaaBackingStoreModel.label]: NooBaaBackingStoreModel.label,
    [NooBaaBucketClassModel.label]: NooBaaBucketClassModel.label,
  };

  const createItemsMap = {
    [createItems[NooBaaBackingStoreModel.label]]: referenceForModel(NooBaaBackingStoreModel),
    [createItems[NooBaaBucketClassModel.label]]: referenceForModel(NooBaaBucketClassModel),
  };

  const createProps = {
    items: createItems,
    createLink: (type: string) => `${operatorPath}/${createItemsMap[type]}/~new`,
  };

  return (
    <MultiListPage
      {...props}
      rowFilters={[resourceTableFilter]}
      ListComponent={ListComponent}
      resources={getFireHoseResources(namespace)}
      flatten={flattenResources}
      createButtonText="Create New"
      canCreate
      createProps={createProps}
    />
  );
};

type MCGResourceListProps = {
  match: match;
  customData: {
    namespace: string;
  };
};

type Resource = {
  [key: string]: FirehoseResult<K8sResourceKind[]>;
};

export default MCGResourceList;
