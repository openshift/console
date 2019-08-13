import * as React from 'react';
import * as _ from 'lodash-es';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Kebab, LabelList, navFactory, ResourceKebab, SectionHeading, StatusIcon, ResourceLink, ResourceSummary, Timestamp } from './utils';

const { common } = Kebab.factory;
const menuActions = [...common];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const kind = 'PersistentVolume';
const Row = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-sm-4 col-xs-6">
    <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-sm-4 col-xs-6">
    <LabelList kind={kind} labels={obj.metadata.labels} />
  </div>
  <div className="col-sm-4 hidden-xs">
    <Timestamp timestamp={obj.metadata.creationTimestamp} />
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
  </div>
</div>;

const Details = ({obj: pv}) => {
  const storageClassName = _.get(pv, 'spec.storageClassName');
  const pvcName = _.get(pv, 'spec.claimRef.name');
  const namespace = _.get(pv, 'spec.claimRef.namespace');
  const storage = _.get(pv, 'spec.capacity.storage');
  const accessModes = _.get(pv, 'spec.accessModes');
  const volumeMode = _.get(pv, 'spec.volumeMode');
  const reclaimPolicy = _.get(pv, 'spec.persistentVolumeReclaimPolicy');
  const phase = _.get(pv, 'status.phase');
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="PersistentVolume Overview" />
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
            <dd><StatusIcon status={phase} /></dd>
            {storage && <dt>Capacity</dt>}
            {storage && <dd>{storage}</dd>}
            {!_.isEmpty(accessModes) && <dt>Access Modes</dt>}
            {!_.isEmpty(accessModes) && <dd>{accessModes.join(', ')}</dd>}
            <dt>Volume Mode</dt>
            <dd>{volumeMode || 'Filesystem'}</dd>
            <dt>Storage Class</dt>
            <dd>
              {storageClassName ? <ResourceLink kind="StorageClass" name={storageClassName} /> : 'None'}
            </dd>
            {pvcName && <dt>Persistent Volume Claim</dt>}
            {pvcName && <dd><ResourceLink kind="PersistentVolumeClaim" name={pvcName} namespace={namespace} /></dd>}
          </dl>
        </div>
      </div>
    </div>
  );
};

export const PersistentVolumesList = props => <List {...props} Header={Header} Row={Row} />;
export const PersistentVolumesPage = props => <ListPage {...props} ListComponent={PersistentVolumesList} kind={kind} canCreate={true} />;
export const PersistentVolumesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
