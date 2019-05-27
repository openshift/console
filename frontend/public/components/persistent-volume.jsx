import * as React from 'react';
import * as _ from 'lodash-es';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Kebab, LabelList, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, Timestamp, StatusIconAndText } from './utils';
import { connectToFlags } from '../reducers/features';
import { FLAGS } from '../const';

const { common } = Kebab.factory;
const menuActions = [...common];

const PVStatus = ({pv}) => <StatusIconAndText status={pv.status.phase} />;

const Header = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-4 hidden-xs" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.claimRef.name">Claim</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.capacity.storage">Capacity</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-4 col-xs-6" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const kind = 'PersistentVolume';

const Row = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-lg-2 col-md-2 col-sm-4 col-xs-6">
    <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-lg-2 col-md-2 col-sm-4 hidden-xs">
    <PVStatus pv={obj} />
  </div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
    {_.get(obj,'spec.claimRef.name') ?
      <ResourceLink kind="PersistentVolumeClaim" name={obj.spec.claimRef.name} namespace={obj.spec.claimRef.namespace} title={obj.spec.claimRef.name} />
      :
      <div className="text-muted">No Claim</div>
    }
  </div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
    {_.get(obj, 'spec.capacity.storage', '-')}
  </div>
  <div className="col-lg-2 col-md-2 col-sm-4 col-xs-6">
    <LabelList kind={kind} labels={obj.metadata.labels} />
  </div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
    <Timestamp timestamp={obj.metadata.creationTimestamp} />
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
  </div>
</div>;

const Details_ = ({obj: pv}) =>{
  const storageClassName = _.get(pv, 'spec.storageClassName');
  const pvcName = _.get(pv, 'spec.claimRef.name');
  const namespace = _.get(pv, 'spec.claimRef.namespace');
  const storage = _.get(pv, 'spec.capacity.storage');
  const accessModes = _.get(pv, 'spec.accessModes');
  const volumeMode = _.get(pv, 'spec.volumeMode');
  const reclaimPolicy = _.get(pv, 'spec.persistentVolumeReclaimPolicy');
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="PersistentVolume Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pv} />
          <dt>Reclaim Policy</dt>
          <dd>{reclaimPolicy}</dd>
        </div>
        <div className="col-sm-6">
          <dl>
            <dt>Status</dt>
            <dd><PVStatus pv={pv} /></dd>
            <dt>Capacity</dt>
            <dd>{storage}</dd>
            {!_.isEmpty(accessModes) && <React.Fragment><dt>Access Modes</dt><dd>{accessModes.join(', ')}</dd></React.Fragment>}
            <dt>Volume Mode</dt>
            <dd>{volumeMode || 'Filesystem' }</dd>
            <dt>Storage Class</dt>
            <dd>
              {storageClassName ? <ResourceLink kind="StorageClass" name={storageClassName} /> : '-'}
            </dd>
            {pvcName && <React.Fragment>
              <dt>Persistent Volume Claim</dt>
              <dd><ResourceLink kind="PersistentVolumeClaim" name={pvcName} namespace={namespace} /></dd>
            </React.Fragment>}
          </dl>
        </div>
      </div>
    </div>
  );
};

const Details = connectToFlags(FLAGS.CAN_LIST_PV)(Details_);

export const PersistentVolumesList = props => <List {...props} Header={Header} Row={Row} />;
export const PersistentVolumesPage = props => <ListPage {...props} ListComponent={PersistentVolumesList} kind={kind} canCreate={true} />;
export const PersistentVolumesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
