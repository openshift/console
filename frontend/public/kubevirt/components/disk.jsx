import React from 'react';
import * as _ from 'lodash';
import { List, ColHead, ListHeader, ResourceRow } from './factory/okdfactory';
import { PersistentVolumeClaimModel } from '../models';
import { Loading, Firehose, Cog } from './utils/okdutils';
import { getResourceKind, getFlattenForKind } from './utils/resources';
import { DASHES, BUS_VIRTIO, DISK } from './utils/constants';
import { deleteDeviceModal } from './modals/delete-device-modal';

const visibleRowStyle = 'col-lg-3 col-md-3 col-sm-3 col-xs-4';
const hiddenRowStyle = 'col-lg-3 col-md-3 col-sm-3 hidden-xs';

const DiskHeader = props => <ListHeader>
  <ColHead {...props} className={visibleRowStyle} sortField="name">Name</ColHead>
  <ColHead {...props} className={visibleRowStyle}>Size</ColHead>
  <ColHead {...props} className={visibleRowStyle}>Interface</ColHead>
  <ColHead {...props} className={hiddenRowStyle}>Storage Class</ColHead>
</ListHeader>;

const PvcRow = props => {
  if (props.loadError) {
    return DASHES;
  } else if (props.loaded){
    const pvc = props.flatten(props.resources);
    return _.get(pvc, props.pvcPath, DASHES);
  }
  return <Loading className="disk-loading" />;
};

const menuActionDelete = (vm, storage) => ({
  label: 'Delete',
  callback: () => deleteDeviceModal({
    type: DISK,
    device: storage,
    vm: vm
  })
});

const getActions = (vm, nic) => {
  const actions = [menuActionDelete];
  return actions.map(a => a(vm, nic));
};

export const DiskRow = ({obj: storage}) => {
  const pvcName = _.get(storage.volume, 'persistentVolumeClaim.claimName');
  let sizeRow = DASHES;
  let storageRow = DASHES;

  if (pvcName) {
    const pvcs = getResourceKind(PersistentVolumeClaimModel, pvcName, true, storage.vm.metadata.namespace, false);
    sizeRow = <Firehose resources={[pvcs]} flatten={getFlattenForKind(PersistentVolumeClaimModel.kind)}>
      <PvcRow pvcPath={'spec.resources.requests.storage'} />
    </Firehose>;
    storageRow = <Firehose resources={[pvcs]} flatten={getFlattenForKind(PersistentVolumeClaimModel.kind)}>
      <PvcRow pvcPath={'spec.storageClassName'} />
    </Firehose>;
  } else {
    const dataVolumeName = _.get(storage.volume, 'dataVolume.name');
    const dataVolume = _.get(storage.vm, 'spec.dataVolumeTemplates', []).find(dv => _.get(dv,'metadata.name') === dataVolumeName);
    if (dataVolume) {
      sizeRow = _.get(dataVolume,'spec.pvc.resources.requests.storage', DASHES);
      storageRow = _.get(dataVolume,'spec.pvc.storageClassName', DASHES);
    }
  }

  return <ResourceRow obj={storage}>
    <div className={visibleRowStyle}>
      {storage.name}
    </div>
    <div className={visibleRowStyle}>
      {sizeRow}
    </div>
    <div className={visibleRowStyle}>
      {_.get(storage, 'disk.bus') || BUS_VIRTIO}
    </div>
    <div className={hiddenRowStyle}>
      {storageRow}
    </div>
    <div className="co-resource-kebab">
      <Cog
        options={getActions(storage.vm, storage)}
        key={`delete-disk-${storage.name}`}
        isDisabled={_.get(storage.vm.metadata, 'deletionTimestamp')}
        id={`cog-for-${storage.name}`}
      />
    </div>
  </ResourceRow>;
};

export const Disk = ({obj: vm}) => {
  const disks = _.get(vm, 'spec.template.spec.domain.devices.disks',[]);
  const volumes = _.get(vm,'spec.template.spec.volumes',[]);
  const storages = disks.map(disk => {
    const volume = volumes.find(v => v.name === disk.volumeName);
    return {
      ...disk,
      vm,
      volume
    };
  });
  return <div className="co-m-list">
    <div className="co-m-pane__body">
      <List data={storages} Header={DiskHeader} Row={DiskRow} loaded={true} />
    </div>
  </div>;
};
