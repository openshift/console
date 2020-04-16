import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';

import { Status } from '@console/shared';
import { connectToFlags } from '../reducers/features';
import { Conditions } from './conditions';
import { FLAGS } from '../const';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, Selector } from './utils';
import { ResourceEventStream } from './events';
import { PersistentVolumeClaimModel } from '../models';

export const pvcPhase = pvc => pvc.status.phase;

const { common, ExpandPVC } = Kebab.factory;
const menuActions = [
  ExpandPVC,
  ...Kebab.getExtensionsActionsForKind(PersistentVolumeClaimModel),
  ...common,
];

const PVCStatus = ({pvc}) => {
  const phase = pvcPhase(pvc);
  return <Status status={phase} />;
};

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const PVCTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status', sortField: 'status.phase', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Persistent Volume', sortField: 'spec.volumeName', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Requested', sortFunc: 'pvcStorage', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};
PVCTableHeader.displayName = 'PVCTableHeader';

const kind = 'PersistentVolumeClaim';

const PVCTableRow = ({obj, index, key, style}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <PVCStatus pvc={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        { _.get(obj, 'spec.volumeName') ?
          <ResourceLink kind="PersistentVolume" name={obj.spec.volumeName} title={obj.spec.volumeName} />:
          <div className="text-muted">No Persistent Volume</div>
        }
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(obj, 'spec.resources.requests.storage', '-')}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};
PVCTableRow.displayName = 'PVCTableRow';

const Details_ = ({flags, obj: pvc}) => {
  const canListPV = flags[FLAGS.CAN_LIST_PV];
  const labelSelector = _.get(pvc, 'spec.selector');
  const storageClassName = _.get(pvc, 'spec.storageClassName');
  const volumeName = _.get(pvc, 'spec.volumeName');
  const requestedStorage = _.get(pvc, 'spec.resources.requests.storage');
  const storage = _.get(pvc, 'status.capacity.storage');
  const accessModes = _.get(pvc, 'status.accessModes');
  const volumeMode = _.get(pvc, 'spec.volumeMode');
  const conditions = _.get(pvc, 'status.conditions');
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="PersistentVolumeClaim Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pvc}>
            <dt>Label Selector</dt>
            <dd><Selector selector={labelSelector} kind="PersistentVolume" /></dd>
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <dl>
            <dt>Status</dt>
            <dd><PVCStatus pvc={pvc} /></dd>
            {storage && <React.Fragment><dt>Size</dt><dd>{storage}</dd></React.Fragment>}
            <dt>Requested</dt>
            <dd>{requestedStorage || '-'}</dd>
            {!_.isEmpty(accessModes) && <React.Fragment><dt>Access Modes</dt><dd>{accessModes.join(', ')}</dd></React.Fragment>}
            <dt>Volume Mode</dt>
            <dd>{volumeMode || 'Filesystem' }</dd>
            <dt>Storage Class</dt>
            <dd>
              {storageClassName ? <ResourceLink kind="StorageClass" name={storageClassName} /> : '-'}
            </dd>
            {volumeName && canListPV && <React.Fragment>
              <dt>Persistent Volume</dt>
              <dd><ResourceLink kind="PersistentVolume" name={volumeName} /></dd>
            </React.Fragment>}
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={conditions} />
    </div>
  </React.Fragment>;
};

const Details = connectToFlags(FLAGS.CAN_LIST_PV)(Details_);

const allPhases = [ 'Pending', 'Bound', 'Lost' ];
const filters = [{
  type: 'pvc-status',
  selected: allPhases,
  reducer: pvcPhase,
  items: _.map(allPhases, phase => ({
    id: phase,
    title: phase,
  })),
}];


export const PersistentVolumeClaimsList = props => <Table {...props} aria-label="Persistent Volume Claims" Header={PVCTableHeader} Row={PVCTableRow} virtualize />;
export const PersistentVolumeClaimsPage = props => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/persistentvolumeclaims/~new/form`,
  };
  return <ListPage {...props} ListComponent={PersistentVolumeClaimsList} kind={kind} canCreate={true} rowFilters={filters} createProps={createProps} />;
};
export const PersistentVolumeClaimsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml(), navFactory.events(ResourceEventStream)]}
/>;
