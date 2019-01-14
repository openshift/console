import React from 'react';
import * as _ from 'lodash-es';
import { Alert, Button } from 'patternfly-react';

import { Kebab, LoadingInline } from './utils/okdutils';
import { List, ColHead, ListHeader, ResourceRow } from './factory/okdfactory';
import { DASHES, BUS_VIRTIO, NIC } from './utils/constants';
import { deleteDeviceModal } from './modals/delete-device-modal';
import { getNetworks, CreateNicRow, getAddNicPatch, POD_NETWORK, settingsValue } from 'kubevirt-web-ui-components';
import { NetworkAttachmentDefinitionModel, VirtualMachineModel } from '../models';
import { getResource } from './utils/resources';
import { WithResources } from './utils/withResources';
import { k8sPatch } from '../module/okdk8s';

const getNetworkName = network => {
  if (network) {
    if (network.hasOwnProperty('pod')){
      return POD_NETWORK;
    } else if (network.hasOwnProperty('multus')){
      return network.multus.networkName;
    }
  }
  return DASHES;
};

const menuActionDelete = (vm, nic) => ({
  label: 'Delete',
  callback: () => deleteDeviceModal({
    type: NIC,
    device: nic,
    vm,
  }),
});

const getActions = (vm, nic) => {
  const actions = [menuActionDelete];
  return actions.map(a => a(vm, nic));
};

const visibleRowStyle = 'col-lg-3 col-md-3 col-sm-3 col-xs-4';
const hiddenRowStyle = 'col-lg-3 col-md-3 col-sm-3 hidden-xs';

const getVmNicModel = vm => {
  const networks = getNetworks(vm);
  return networks.length > 0 ? _.get(networks[0], 'model', BUS_VIRTIO) : BUS_VIRTIO;
};

const NicHeader = props => <ListHeader>
  <ColHead {...props} className={visibleRowStyle} sortField="name">Name</ColHead>
  <ColHead {...props} className={visibleRowStyle} sortField="model">Model</ColHead>
  <ColHead {...props} className={visibleRowStyle} sortField="network">Network</ColHead>
  <ColHead {...props} className={hiddenRowStyle} sortField="macAddress">MAC Address</ColHead>
</ListHeader>;

export const VmNicRow = ({ nic }) => <ResourceRow obj={nic}>
  <div className={visibleRowStyle}>
    {nic.name}
  </div>
  <div className={visibleRowStyle}>
    {nic.model || BUS_VIRTIO}
  </div>
  <div className={visibleRowStyle}>
    {getNetworkName(nic.network)}
  </div>
  <div className={hiddenRowStyle}>
    {nic.macAddress || DASHES}
  </div>
  <div className="dropdown-kebab-pf">
    <Kebab
      options={getActions(nic.vm, nic)}
      key={`delete-nic-${nic.name}`}
      isDisabled={_.get(nic.vm.metadata, 'deletionTimestamp')}
      id={`kebab-for-${nic.name}`}
    />
  </div>
</ResourceRow>;

const NIC_TYPE_VM = 'nic-type-vm';
const NIC_TYPE_CREATE = 'nic-type-create';

export const NicRow = (onChange, onAccept, onCancel) => ({obj: nic}) => {
  const networks = {
    resource: getResource(NetworkAttachmentDefinitionModel),
  };
  switch (nic.nicType) {
    case NIC_TYPE_VM:
      return <VmNicRow nic={nic} />;
    case NIC_TYPE_CREATE:
      return <div className="row co-resource-list__item">
        <WithResources resourceMap={{networks}}>
          <CreateNicRow
            nic={nic}
            onAccept={onAccept}
            onCancel={onCancel}
            onChange={onChange}
            LoadingComponent={LoadingInline}
          />
        </WithResources>
      </div>;
    default:
      // eslint-disable-next-line
      console.warn(`Unknown nic type ${nic.nicType}`);
      break;
  }
};

export class Nic extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      newNic: null,
    };
    this._getNics = this.getNics.bind(this);
    this._createNicHandler = this.createNicHandler.bind(this);
    this._onChange = this.onChange.bind(this);
    this._onCancel = this.onCancel.bind(this);
    this._onAccept = this.onAccept.bind(this);
    this._errorDismissHandler = this.errorDismissHandler.bind(this);
    this.NicRow = NicRow(this._onChange, this._onAccept, this._onCancel);
  }

  getNics(vm) {
    const nics = this.state.newNic ? [{...this.state.newNic}] : [];
    const interfaces = _.get(vm,'spec.template.spec.domain.devices.interfaces',[]);
    const networks = _.get(vm,'spec.template.spec.networks',[]);
    nics.push(...interfaces.map(nic => {
      const network = networks.find(n => n.name === nic.name);
      return {
        ...nic,
        vm,
        network,
        nicType: NIC_TYPE_VM,
      };
    }));
    return nics;
  }

  createNicHandler() {
    this.setState({
      newNic: {
        nicType: NIC_TYPE_CREATE,
        model: {
          value: getVmNicModel(this.props.obj),
        },
        vm: this.props.obj,
      },
    });
  }

  onChange(value, key) {
    this.setState(state => ({
      newNic: {
        ...state.newNic,
        [key]: value,
      },
    }));
  }

  onAccept() {
    const newNic = {
      ...this.state.newNic,
      error: null,
      creating: true,
    };
    const nic = {
      name: settingsValue(newNic, 'name'),
      model: settingsValue(newNic, 'model'),
      network: settingsValue(newNic, 'network'),
      mac: settingsValue(newNic, 'mac'),
    };

    const addNicPatch = getAddNicPatch(this.props.obj, nic);
    const patch = k8sPatch(VirtualMachineModel, this.props.obj, addNicPatch);
    patch.then(() => {
      this.setState({newNic: null});
    }).catch(error => {
      this.setState({
        newNic: {
          ...this.state.newNic,
          error: error.message || 'Error occured, please try again',
          creating: false,
        },
      });
    });
    this.setState({
      newNic,
    });
  }

  onCancel() {
    this.setState({
      newNic: null,
    });
  }

  errorDismissHandler() {
    this.setState({
      newNic: {
        ...this.state.newNic,
        error: null,
      },
    });
  }

  render() {
    const vm = this.props.obj;
    const nics = this.getNics(vm);
    const alert = _.get(this.state.newNic, 'error') && <Alert onDismiss={this._errorDismissHandler}>{this.state.newNic.error}</Alert>;
    return <div className="co-m-list">
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <Button bsStyle="primary" id="create-nic-btn" onClick={this._createNicHandler} disabled={!!this.state.newNic}>Create NIC</Button>
        </div>
      </div>
      <div className="co-m-pane__body">
        {alert}
        <List data={nics} Header={NicHeader} Row={this.NicRow} loaded={true} />
      </div>
    </div>;
  }
}
