import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  DetailsItem,
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  detailsPage,
  navFactory,
} from './utils';
import { StorageClassResourceKind, K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { StorageClassModel } from '../models';

export const StorageClassReference: K8sResourceKindReference = 'StorageClass';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(StorageClassModel), ...common];

const defaultClassAnnotation = 'storageclass.kubernetes.io/is-default-class';
const betaDefaultStorageClassAnnotation = 'storageclass.beta.kubernetes.io/is-default-class';
export const isDefaultClass = (storageClass: K8sResourceKind) => {
  const annotations = _.get(storageClass, 'metadata.annotations') || {};
  return (
    annotations[defaultClassAnnotation] === 'true' ||
    annotations[betaDefaultStorageClassAnnotation] === 'true'
  );
};

const tableColumnClasses = [
  'pf-u-w-42-on-md',
  'pf-u-w-42-on-md',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-16-on-md',
  Kebab.columnClass,
];

const StorageClassDetails: React.FC<StorageClassDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~StorageClass details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj}>
              <DetailsItem label={t('public~Provisioner')} obj={obj} path="provisioner" />
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <DetailsItem label={t('public~Reclaim policy')} obj={obj} path="reclaimPolicy" />
              <dt>{t('public~Default class')}</dt>
              <dd>{isDefaultClass(obj) ? t('public~True') : t('public~False')}</dd>
              <DetailsItem
                label={t('public~Volume binding mode')}
                obj={obj}
                path="volumeBindingMode"
              />
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

export const StorageClassList: React.FC = (props) => {
  const { t } = useTranslation();
  const StorageClassTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Provisioner'),
        sortField: 'provisioner',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Reclaim policy'),
        sortField: 'reclaimPolicy',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };
  const StorageClassTableRow: RowFunction<StorageClassResourceKind> = ({
    obj,
    index,
    key,
    style,
  }) => {
    return (
      <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
          <ResourceLink kind={StorageClassReference} name={obj.metadata.name}>
            {isDefaultClass(obj) && (
              <span className="small text-muted co-resource-item__help-text">
                &ndash; {t('public~Default')}
              </span>
            )}
          </ResourceLink>
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
          {obj.provisioner}
        </TableData>
        <TableData className={tableColumnClasses[2]}>{obj.reclaimPolicy || '-'}</TableData>
        <TableData className={tableColumnClasses[3]}>
          <ResourceKebab actions={menuActions} kind={StorageClassReference} resource={obj} />
        </TableData>
      </TableRow>
    );
  };
  return (
    <Table
      {...props}
      aria-label={t('public~StorageClasses')}
      Header={StorageClassTableHeader}
      Row={StorageClassTableRow}
      virtualize
    />
  );
};
StorageClassList.displayName = 'StorageClassList';

export const StorageClassPage: React.FC<StorageClassPageProps> = (props) => {
  const createProps = {
    to: '/k8s/cluster/storageclasses/~new/form',
  };
  const { t } = useTranslation();
  return (
    <ListPage
      {..._.omit(props, 'mock')}
      title={t('public~StorageClasses')}
      kind={StorageClassReference}
      ListComponent={StorageClassList}
      canCreate={true}
      filterLabel={props.filterLabel}
      createProps={createProps}
      createButtonText={t('public~Create StorageClass')}
    />
  );
};

const pages = [navFactory.details(detailsPage(StorageClassDetails)), navFactory.editYaml()];

export const StorageClassDetailsPage: React.FC<StorageClassDetailsPageProps> = (props) => {
  return (
    <DetailsPage {...props} kind={StorageClassReference} menuActions={menuActions} pages={pages} />
  );
};
StorageClassDetailsPage.displayName = 'StorageClassDetailsPage';

export type StorageClassDetailsProps = {
  obj: any;
};

export type StorageClassPageProps = {
  filterLabel: string;
  namespace: string;
};

export type StorageClassDetailsPageProps = {
  match: any;
};
