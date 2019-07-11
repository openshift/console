import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, detailsPage, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary } from './utils';
import { StorageClassResourceKind, K8sResourceKind, K8sResourceKindReference } from '../module/k8s';

export const StorageClassReference: K8sResourceKindReference = 'StorageClass';

const { common } = Kebab.factory;
const menuActions = [...common];

const defaultClassAnnotation = 'storageclass.kubernetes.io/is-default-class';
const betaDefaultStorageClassAnnotation = 'storageclass.beta.kubernetes.io/is-default-class';
export const isDefaultClass = (storageClass: K8sResourceKind) => {
  const annotations = _.get(storageClass, 'metadata.annotations') || {};
  return annotations[defaultClassAnnotation] === 'true' || annotations[betaDefaultStorageClassAnnotation] === 'true';
};

const tableColumnClasses = [
  classNames('col-sm-5', 'col-xs-6'),
  classNames('col-sm-5', 'col-xs-6'),
  classNames('col-sm-2', 'hidden-xs'),
  Kebab.columnClass,
];

const StorageClassTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Provisioner', sortField: 'provisioner', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: <React.Fragment>Reclaim <span className="hidden-sm">Policy</span></React.Fragment>,
      sortField: 'reclaimPolicy', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '', props: { className: tableColumnClasses[3] },
    },
  ];
};
StorageClassTableHeader.displayName = 'StorageClassTableHeader';

const StorageClassTableRow: React.SFC<StorageClassTableRowProps> = ({obj, index, key, style}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink inline kind={StorageClassReference} name={obj.metadata.name} />
        { isDefaultClass(obj) && <span className="small text-muted storage-class-default">&ndash; Default</span> }
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {obj.provisioner}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {obj.reclaimPolicy || '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={StorageClassReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};
StorageClassTableRow.displayName = 'StorageClassTableRow';
type StorageClassTableRowProps = {
  obj: StorageClassResourceKind;
  index: number;
  key?: string;
  style: object;
};

const StorageClassDetails: React.SFC<StorageClassDetailsProps> = ({obj}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="StorageClass Overview" />
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={obj}>
          <dt>Provisioner</dt>
          <dd>{obj.provisioner || '-'}</dd>
        </ResourceSummary>
      </div>
      <div className="col-sm-6">
        <dt>Reclaim Policy</dt>
        <dd>{obj.reclaimPolicy || '-'}</dd>
        <dt>Default Class</dt>
        <dd>{isDefaultClass(obj).toString()}</dd>
      </div>
    </div>
  </div>
</React.Fragment>;

export const StorageClassList: React.SFC = props => <Table {...props} aria-label="Storage Classes" Header={StorageClassTableHeader} Row={StorageClassTableRow} virtualize />;
StorageClassList.displayName = 'StorageClassList';

export const StorageClassPage: React.SFC<StorageClassPageProps> = props => {
  const createProps = {
    to: '/k8s/cluster/storageclasses/~new/form',
  };

  return <ListPage
    {..._.omit(props, 'mock')}
    title="Storage Classes"
    kind={StorageClassReference}
    ListComponent={StorageClassList}
    canCreate={true}
    filterLabel={props.filterLabel}
    createProps={createProps}
    createButtonText="Create Storage Class" />;
};

const pages = [navFactory.details(detailsPage(StorageClassDetails)), navFactory.editYaml()];

export const StorageClassDetailsPage: React.SFC<StorageClassDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={StorageClassReference} menuActions={menuActions} pages={pages} />;
};
StorageClassDetailsPage.displayName = 'StorageClassDetailsPage';

export type StorageClassDetailsProps = {
  obj: any,
};

export type StorageClassPageProps = {
  filterLabel: string,
  namespace: string
};

export type StorageClassDetailsPageProps = {
  match: any,
};
