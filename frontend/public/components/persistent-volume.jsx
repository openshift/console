import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';

import { Status } from '@console/shared';
import { useTranslation } from 'react-i18next';

import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  Kebab,
  LabelList,
  navFactory,
  ResourceKebab,
  SectionHeading,
  ResourceLink,
  ResourceSummary,
  Timestamp,
} from './utils';
import { PersistentVolumeModel } from '../models';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(PersistentVolumeModel), ...common];

const PVStatus = ({ pv }) => (
  <Status status={pv.metadata.deletionTimestamp ? 'Terminating' : pv.status.phase} />
);

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const kind = 'PersistentVolume';

const PVTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <PVStatus pv={obj} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.get(obj, 'spec.claimRef.name') ? (
          <ResourceLink
            kind="PersistentVolumeClaim"
            name={obj.spec.claimRef.name}
            namespace={obj.spec.claimRef.namespace}
            title={obj.spec.claimRef.name}
          />
        ) : (
          <div className="text-muted">No Claim</div>
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.get(obj, 'spec.capacity.storage', '-')}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const Details = ({ obj: pv }) => {
  const { t } = useTranslation();
  const storageClassName = _.get(pv, 'spec.storageClassName');
  const pvcName = _.get(pv, 'spec.claimRef.name');
  const namespace = _.get(pv, 'spec.claimRef.namespace');
  const storage = _.get(pv, 'spec.capacity.storage');
  const accessModes = _.get(pv, 'spec.accessModes');
  const volumeMode = _.get(pv, 'spec.volumeMode');
  const reclaimPolicy = _.get(pv, 'spec.persistentVolumeReclaimPolicy');
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('public~PersistentVolume details')} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pv}>
            <dt>{t('public~Reclaim policy')}</dt>
            <dd>{reclaimPolicy}</dd>
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <dl>
            <dt>{t('public~Status')}</dt>
            <dd>
              <PVStatus pv={pv} />
            </dd>
            {storage && (
              <>
                <dt>{t('public~Capacity')}</dt>
                <dd>{storage}</dd>
              </>
            )}
            {!_.isEmpty(accessModes) && (
              <>
                <dt>{t('public~Access modes')}</dt>
                <dd>{accessModes.join(', ')}</dd>
              </>
            )}
            <dt>{t('public~Volume mode')}</dt>
            <dd>{volumeMode || t('public~Filesystem')}</dd>
            <dt>{t('public~StorageClass')}</dt>
            <dd>
              {storageClassName ? (
                <ResourceLink kind="StorageClass" name={storageClassName} />
              ) : (
                t('public~None')
              )}
            </dd>
            {pvcName && (
              <>
                <dt>{t('public~PersistentVolumeClaim')}</dt>
                <dd>
                  <ResourceLink kind="PersistentVolumeClaim" name={pvcName} namespace={namespace} />
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export const PersistentVolumesList = (props) => {
  const { t } = useTranslation();
  const PVTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Status'),
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Claim'),
        sortField: 'spec.claimRef.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Capacity'),
        sortFunc: 'pvStorage',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[6] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('public~PersistentVolumes')}
      Header={PVTableHeader}
      Row={PVTableRow}
      virtualize
    />
  );
};

export const PersistentVolumesPage = (props) => (
  <ListPage {...props} ListComponent={PersistentVolumesList} kind={kind} canCreate={true} />
);
export const PersistentVolumesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);
