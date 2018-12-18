import React from 'react';
import * as _ from 'lodash-es';
import { Button, Alert } from 'patternfly-react';
import { List, ColHead, ListHeader, ResourceRow } from './factory/okdfactory';
import { PersistentVolumeClaimModel, StorageClassModel, VirtualMachineModel } from '../models';
import { Loading, Firehose, Kebab } from './utils/okdutils';
import { getResourceKind, getFlattenForKind } from './utils/resources';
import { DASHES, BUS_VIRTIO, DISK } from './utils/constants';
import { deleteDeviceModal } from './modals/delete-device-modal';
import { CreateDiskRow, getAddDiskPatch, getDisks } from 'kubevirt-web-ui-components';
import { k8sPatch } from '../module/okdk8s';
import { LoadingInline } from './okdcomponents';
import { WithResources } from './utils/withResources';

const columnStyle = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';

const DiskHeader = props => <ListHeader>
  <ColHead {...props} className={columnStyle} sortField="name">Name</ColHead>
  <ColHead {...props} className={columnStyle}>Size</ColHead>
  <ColHead {...props} className={columnStyle}>Interface</ColHead>
  <ColHead {...props} className={columnStyle}>Storage Class</ColHead>
</ListHeader>;

const PvcColumn = props => {
  if (props.loadError) {
    return DASHES;
  } else if (props.loaded){
    const pvc = props.flatten(props.resources);
    return _.get(pvc, props.pvcPath, DASHES);
  }
  return <Loading className="kubevirt-disk__loading" />;
};

const menuActionDelete = (vm, storage) => ({
  label: 'Delete',
  callback: () => deleteDeviceModal({
    type: DISK,
    device: storage,
    vm: vm,
  }),
});

const getActions = (vm, nic) => {
  const actions = [menuActionDelete];
  return actions.map(a => a(vm, nic));
};

const VmDiskRow = ({ storage }) => {
  const pvcName = _.get(storage.volume, 'persistentVolumeClaim.claimName');
  let sizeColumn;
  let storageColumn;

  if (pvcName) {
    const pvcs = getResourceKind(PersistentVolumeClaimModel, pvcName, true, storage.vm.metadata.namespace, false);
    sizeColumn = <Firehose resources={[pvcs]} flatten={getFlattenForKind(PersistentVolumeClaimModel.kind)}>
      <PvcColumn pvcPath={'spec.resources.requests.storage'} />
    </Firehose>;
    storageColumn = <Firehose resources={[pvcs]} flatten={getFlattenForKind(PersistentVolumeClaimModel.kind)}>
      <PvcColumn pvcPath={'spec.storageClassName'} />
    </Firehose>;
  } else {
    const dataVolumeName = _.get(storage.volume, 'dataVolume.name');
    const dataVolume = _.get(storage.vm, 'spec.dataVolumeTemplates', []).find(dv => _.get(dv,'metadata.name') === dataVolumeName);
    if (dataVolume) {
      sizeColumn = _.get(dataVolume,'spec.pvc.resources.requests.storage');
      storageColumn = _.get(dataVolume,'spec.pvc.storageClassName');
    }
  }

  return <ResourceRow obj={storage}>
    <div className={columnStyle}>
      {storage.name}
    </div>
    <div className={columnStyle}>
      {sizeColumn || DASHES}
    </div>
    <div className={columnStyle}>
      {_.get(storage, 'disk.bus') || BUS_VIRTIO}
    </div>
    <div className={columnStyle}>
      {storageColumn || DASHES}
    </div>
    <div className="dropdown-kebab-pf">
      <Kebab
        options={getActions(storage.vm, storage)}
        key={`kebab-for--${storage.name}`}
        isDisabled={_.get(storage.vm.metadata, 'deletionTimestamp')}
        id={`kebab-for-${storage.name}`}
      />
    </div>
  </ResourceRow>;
};


const STORAGE_TYPE_VM = 'storage-type-vm';
const STORAGE_TYPE_CREATE = 'storage-type-create';

export const DiskRow = (onChange, onAccept, onCancel) => ({obj: storage}) => {
  const storageClasses = {
    resource: getResourceKind(StorageClassModel, undefined, false, undefined, true),
  };
  switch (storage.storageType) {
    case STORAGE_TYPE_VM:
      return <VmDiskRow storage={storage} />;
    case STORAGE_TYPE_CREATE:
      return <div className="row co-resource-list__item">
        <WithResources resourceMap={{storageClasses}}>
          <CreateDiskRow
            storage={storage}
            onAccept={onAccept}
            onCancel={onCancel}
            onChange={onChange}
            LoadingComponent={LoadingInline}
          />
        </WithResources>
      </div>;
    default:
      // eslint-disable-next-line
      console.warn(`Unknown storage type ${storage.storageType}`);
      break;
  }
};

const getVmDiskBus = vm => {
  const disks = getDisks(vm);
  return disks.length > 0 ? _.get(disks[0], 'disk.bus', BUS_VIRTIO) : BUS_VIRTIO;
};

export class Disk extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      newStorage: null,
    };
    this._getStorages = this.getStorages.bind(this);
    this._createStorageHandler = this.createStorageHandler.bind(this);
    this._onChange = this.onChange.bind(this);
    this._onAccept = this.onAccept.bind(this);
    this._onCancel = this.onCancel.bind(this);
    this._errorDismissHandler = this.errorDismissHandler.bind(this);
    this.DiskRow = DiskRow(this._onChange, this._onAccept, this._onCancel);
  }

  getStorages(vm) {
    const storages = this.state.newStorage ? [{...this.state.newStorage}] : [];
    const disks = _.get(vm, 'spec.template.spec.domain.devices.disks',[]);
    const volumes = _.get(vm,'spec.template.spec.volumes',[]);
    storages.push(...disks.map(disk => {
      const volume = volumes.find(v => v.name === disk.volumeName);
      return {
        ...disk,
        vm,
        volume,
        storageType: STORAGE_TYPE_VM,
      };
    }));
    return storages;
  }

  createStorageHandler() {
    this.setState({
      newStorage: {
        storageType: STORAGE_TYPE_CREATE,
        bus: {
          value: getVmDiskBus(this.props.obj),
        },
      },
    });
  }

  onChange(value, key) {
    const newStorage = {
      ...this.state.newStorage,
      [key]: value,
    };
    this.setState({
      newStorage,
    });
  }

  onAccept() {
    const newStorage = {
      ...this.state.newStorage,
      error: null,
      creating: true,
    };
    const storage = {
      name: _.get(newStorage, 'name.value'),
      size: _.get(newStorage, 'size.value'),
      bus: _.get(newStorage, 'bus.value'),
      storageClass: _.get(newStorage, 'storageClass.value'),
    };

    const addDiskPatch = getAddDiskPatch(this.props.obj, storage);
    const patch = k8sPatch(VirtualMachineModel, this.props.obj, addDiskPatch);
    patch.then(() => {
      this.setState({newStorage: null});
    }).catch(error => {
      this.setState({
        newStorage: {
          ...this.state.newStorage,
          error: error.message || 'Error occured, please try again',
          creating: false,
        },
      });
    });
    this.setState({
      newStorage,
    });
  }

  onCancel() {
    this.setState({
      newStorage: null,
    });
  }

  errorDismissHandler() {
    this.setState({
      newStorage: {
        ...this.state.newStorage,
        error: null,
      },
    });
  }

  render() {
    const vm = this.props.obj;
    const storages = this.getStorages(vm);
    const alert = _.get(this.state.newStorage, 'error') && <Alert onDismiss={this._errorDismissHandler}>{this.state.newStorage.error}</Alert>;
    return <React.Fragment>
      <div className="co-m-list">
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <Button bsStyle="primary" id="create-disk-btn" onClick={this._createStorageHandler} disabled={!!this.state.newStorage}>Create Disk</Button>
          </div>
        </div>
        <div className="co-m-pane__body">
          {alert}
          <List data={storages} Header={DiskHeader} Row={this.DiskRow} loaded={true} />
        </div>
      </div>
    </React.Fragment>;
  }
}
