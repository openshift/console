import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { Status } from '@console/shared';
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

const PVTableHeader = (t) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_13'),
      sortField: 'spec.claimRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_14'),
      sortFunc: 'pvStorage',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_15'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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
PVTableHeader.displayName = 'PVTableHeader';

const kind = 'PersistentVolume';

const PVTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
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
  const storageClassName = _.get(pv, 'spec.storageClassName');
  const pvcName = _.get(pv, 'spec.claimRef.name');
  const namespace = _.get(pv, 'spec.claimRef.namespace');
  const storage = _.get(pv, 'spec.capacity.storage');
  const accessModes = _.get(pv, 'spec.accessModes');
  const volumeMode = _.get(pv, 'spec.volumeMode');
  const reclaimPolicy = _.get(pv, 'spec.persistentVolumeReclaimPolicy');
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="PersistentVolume Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pv}>
            <dt>Reclaim Policy</dt>
            <dd>{reclaimPolicy}</dd>
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <dl>
            <dt>Status</dt>
            <dd>
              <PVStatus pv={pv} />
            </dd>
            {storage && (
              <>
                <dt>Capacity</dt>
                <dd>{storage}</dd>
              </>
            )}
            {!_.isEmpty(accessModes) && (
              <>
                <dt>Access Modes</dt>
                <dd>{accessModes.join(', ')}</dd>
              </>
            )}
            <dt>Volume Mode</dt>
            <dd>{volumeMode || 'Filesystem'}</dd>
            <dt>Storage Class</dt>
            <dd>
              {storageClassName ? (
                <ResourceLink kind="StorageClass" name={storageClassName} />
              ) : (
                  'None'
                )}
            </dd>
            {pvcName && (
              <>
                <dt>Persistent Volume Claim</dt>
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
  return <Table
      {...props}
      aria-label="Persistent Volumes"
      Header={PVTableHeader.bind(null, t)}
      Row={PVTableRow}
      virtualize
    />;
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
