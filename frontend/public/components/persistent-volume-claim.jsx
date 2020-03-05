import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';

import { Status, FLAGS } from '@console/shared';
import { connectToFlags } from '../reducers/features';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  SectionHeading,
  ResourceLink,
  ResourceSummary,
  Selector,
} from './utils';
import { ResourceEventStream } from './events';

const { ExpandPVC } = Kebab.factory;
const menuActions = [ExpandPVC, ...Kebab.factory.common];

const PVCStatus = ({ pvc }) => (
  <Status status={pvc.metadata.deletionTimestamp ? 'Terminating' : pvc.status.phase} />
);

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const PVCTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
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
      title: 'Persistent Volume',
      sortField: 'spec.volumeName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Capacity',
      sortFunc: 'pvcStorage',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Storage Class',
      sortField: 'spec.storageClassName',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
PVCTableHeader.displayName = 'PVCTableHeader';

const kind = 'PersistentVolumeClaim';

const PVCTableRow = ({ obj, index, key, style }) => {
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
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <PVCStatus pvc={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.get(obj, 'spec.volumeName') ? (
          <ResourceLink
            kind="PersistentVolume"
            name={obj.spec.volumeName}
            title={obj.spec.volumeName}
          />
        ) : (
          <div className="text-muted">No Persistent Volume</div>
        )}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(obj, 'status.capacity.storage', '-')}
      </TableData>
      <TableData className={classNames(tableColumnClasses[5])}>
        {obj?.spec?.storageClassName ? (
          <ResourceLink
            kind="StorageClass"
            name={obj?.spec?.storageClassName}
            title={obj?.spec?.storageClassName}
          />
        ) : (
          <div className="text-muted">-</div>
        )}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const Details_ = ({ flags, obj: pvc }) => {
  const canListPV = flags[FLAGS.CAN_LIST_PV];
  const labelSelector = _.get(pvc, 'spec.selector');
  const storageClassName = _.get(pvc, 'spec.storageClassName');
  const volumeName = _.get(pvc, 'spec.volumeName');
  const storage = _.get(pvc, 'status.capacity.storage');
  const accessModes = _.get(pvc, 'status.accessModes');
  const volumeMode = _.get(pvc, 'spec.volumeMode');
  const conditions = _.get(pvc, 'status.conditions');
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="PersistentVolumeClaim Details" />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={pvc}>
              <dt>Label Selector</dt>
              <dd data-test-id="pvc-name">
                <Selector selector={labelSelector} kind="PersistentVolume" />
              </dd>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl>
              <dt>Status</dt>
              <dd data-test-id="pvc-status">
                <PVCStatus pvc={pvc} />
              </dd>
              {storage && (
                <>
                  <dt>Capacity</dt>
                  <dd data-test-id="pvc-capacity">{storage}</dd>
                </>
              )}
              {!_.isEmpty(accessModes) && (
                <>
                  <dt>Access Modes</dt>
                  <dd data-test-id="pvc-access-mode">{accessModes.join(', ')}</dd>
                </>
              )}
              <dt>Volume Mode</dt>
              <dd data-test-id="pvc-volume-mode">{volumeMode || 'Filesystem'}</dd>
              <dt>Storage Class</dt>
              <dd data-test-id="pvc-storageclass">
                {storageClassName ? (
                  <ResourceLink kind="StorageClass" name={storageClassName} />
                ) : (
                  '-'
                )}
              </dd>
              {volumeName && canListPV && (
                <>
                  <dt>Persistent Volume</dt>
                  <dd data-test-id="persistent-volume">
                    <ResourceLink kind="PersistentVolume" name={volumeName} />
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={conditions} />
      </div>
    </>
  );
};

const Details = connectToFlags(FLAGS.CAN_LIST_PV)(Details_);

const allPhases = ['Pending', 'Bound', 'Lost'];
const filters = [
  {
    filterGroupName: 'Status',
    type: 'pvc-status',
    reducer: (pvc) => pvc.status.phase,
    items: _.map(allPhases, (phase) => ({
      id: phase,
      title: phase,
    })),
  },
];

export const PersistentVolumeClaimsList = (props) => (
  <Table
    {...props}
    aria-label="Persistent Volume Claims"
    Header={PVCTableHeader}
    Row={PVCTableRow}
    virtualize
  />
);
export const PersistentVolumeClaimsPage = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/persistentvolumeclaims/~new/form`,
  };
  return (
    <ListPage
      {...props}
      ListComponent={PersistentVolumeClaimsList}
      kind={kind}
      canCreate={true}
      rowFilters={filters}
      createProps={createProps}
    />
  );
};
export const PersistentVolumeClaimsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[
      navFactory.details(Details),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
  />
);
