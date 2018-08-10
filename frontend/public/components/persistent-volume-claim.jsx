import * as React from 'react';
import * as _ from 'lodash-es';

import { FLAGS, connectToFlags } from '../features';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, ResourceCog, SectionHeading, ResourceLink, ResourceSummary, Selector } from './utils';
import { ResourceEventStream } from './events';

const pvcPhase = pvc => pvc.status.phase;
const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const PVCStatus = ({pvc}) => {
  const phase = pvcPhase(pvc);
  if (!phase) {
    return '-';
  }

  switch (phase) {
    case 'Pending':
      return <span className="text-muted"><i className="fa fa-hourglass-half" aria-hidden="true"></i> Pending</span>;
    case 'Bound':
      return <span className="pvc-bound"><i className="fa fa-check" aria-hidden="true"></i> Bound</span>;
    case 'Lost':
      return <span className="pvc-lost"><i className="fa fa-minus-circle" aria-hidden="true"></i> Lost</span>;
    default:
      return phase;
  }
};

const Header = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="status.phase">Status</ColHead>
</ListHeader>;

const kind = 'PersistentVolumeClaim';
const Row = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind={kind} resource={obj} />
    <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-sm-4 col-xs-4 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
  </div>
  <div className="col-sm-4 hidden-xs">
    <PVCStatus pvc={obj} />
  </div>
</div>;

const Details_ = ({flags, obj: pvc}) => {
  const canListPV = flags[FLAGS.CAN_LIST_PV];
  const labelSelector = _.get(pvc, 'spec.selector');
  const storageClassName = _.get(pvc, 'spec.storageClassName');
  const volumeName = _.get(pvc, 'spec.volumeName');
  const requestedStorage = _.get(pvc, 'spec.resources.requests.storage');
  const storage = _.get(pvc, 'status.capacity.storage');
  const accessModes = _.get(pvc, 'status.accessModes');
  return <div className="co-m-pane__body">
    <SectionHeading text="PersistentVolumeClaim Overview" />
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={pvc} showPodSelector={false} showNodeSelector={false}>
          <dt>Label Selector</dt>
          <dd><Selector selector={labelSelector} /></dd>
        </ResourceSummary>
      </div>
      <div className="col-sm-6">
        <dl>
          <dt>Status</dt>
          <dd><PVCStatus pvc={pvc} /></dd>
          <dt>Storage Class</dt>
          <dd>
            {storageClassName ? <ResourceLink kind="StorageClass" name={storageClassName} /> : '-'}
          </dd>
          {volumeName && canListPV && <React.Fragment>
            <dt>Persistent Volume</dt>
            <dd><ResourceLink kind="PersistentVolume" name={volumeName} /></dd>
          </React.Fragment>}
          <dt>Requested</dt>
          <dd>{requestedStorage || '-'}</dd>
          {storage && <React.Fragment><dt>Size</dt><dd>{storage}</dd></React.Fragment>}
          {!_.isEmpty(accessModes) && <React.Fragment><dt>Access Modes</dt><dd>{accessModes.join(', ')}</dd></React.Fragment>}
        </dl>
      </div>
    </div>
  </div>;
};

const Details = connectToFlags(FLAGS.CAN_LIST_PV)(Details_);

const allPhases = [ 'Pending', 'Bound', 'Lost' ];
const filters = [{
  type: 'pod-status',
  selected: allPhases,
  reducer: pvcPhase,
  items: _.map(allPhases, phase => ({
    id: phase,
    title: phase,
  }))
}];


export const PersistentVolumeClaimsList = props => <List {...props} Header={Header} Row={Row} />;
export const PersistentVolumeClaimsPage = props => <ListPage {...props} ListComponent={PersistentVolumeClaimsList} kind={kind} canCreate={true} rowFilters={filters} />;
export const PersistentVolumeClaimsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml(), navFactory.events(ResourceEventStream)]}
/>;
