import React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import { Alert, Button } from 'patternfly-react';

import { Kebab, LoadingInline } from './utils/okdutils';
import { List, ColHead, ListHeader, ResourceRow } from './factory/okdfactory';
import { DASHES, BUS_VIRTIO, NIC } from './utils/constants';
import { deleteDeviceModal } from './modals/delete-device-modal';
import {
  getNetworks,
  CreateNicRow,
  getAddNicPatch,
  POD_NETWORK,
  settingsValue,
  getNamespace,
  getResource,
  addPrefixToPatch,
  getInterfaceBinding,
} from 'kubevirt-web-ui-components';
import { NetworkAttachmentDefinitionModel, VirtualMachineModel, VmTemplateModel } from '../models';
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

const menuActionDelete = (vm, nic, vmTemplate, patchPrefix) => ({
  label: 'Delete',
  callback: () => deleteDeviceModal({
    type: NIC,
    device: nic,
    vm,
    vmTemplate,
    patchPrefix,
  }),
});

const getActions = (vm, nic, vmTemplate, patchPrefix) => {
  const actions = [menuActionDelete];
  return actions.map(a => a(vm, nic, vmTemplate, patchPrefix));
};

const mainRowStyle = 'col-lg-3';
const otherRowStyle = 'col-lg-2';

const getVmNicModel = vm => {
  const networks = getNetworks(vm);
  return networks.length > 0 ? _.get(networks[0], 'model', BUS_VIRTIO) : BUS_VIRTIO;
};

const NicHeader = props => <ListHeader>
  <ColHead {...props} className={mainRowStyle} sortField="name">Name</ColHead>
  <ColHead {...props} className={mainRowStyle} sortField="model">Model</ColHead>
  <ColHead {...props} className={otherRowStyle} sortField="network">Network</ColHead>
  <ColHead {...props} className={otherRowStyle} sortField="macAddress">Binding Method</ColHead>
  <ColHead {...props} className={otherRowStyle} sortField="macAddress">MAC Address</ColHead>
</ListHeader>;

export const VmNicRow = ({ nic }) => <ResourceRow obj={nic}>
  <div className={mainRowStyle}>
    {nic.name}
  </div>
  <div className={mainRowStyle}>
    {nic.model || BUS_VIRTIO}
  </div>
  <div className={otherRowStyle}>
    {getNetworkName(nic.network)}
  </div>
  <div className={otherRowStyle}>
    {nic.binding || DASHES}
  </div>
  <div className={otherRowStyle}>
    {nic.macAddress || DASHES}
  </div>
  <div className="dropdown-kebab-pf">
    <Kebab
      options={getActions(nic.vm, nic, nic.vmTemplate, nic.patchPrefix)}
      key={`delete-nic-${nic.name}`}
      isDisabled={_.get(nic.vm.metadata, 'deletionTimestamp')}
      id={`kebab-for-${nic.name}`}
    />
  </div>
</ResourceRow>;

const NIC_TYPE_VM = 'nic-type-vm';
const NIC_TYPE_CREATE = 'nic-type-create';

export const NicRow = (onChange, onAccept, onCancel) => ({obj: nic}) => {
  const namespace = getNamespace(nic.vmTemplate || nic.vm); // order matters
  const networks = {
    resource: getResource(NetworkAttachmentDefinitionModel, {namespace}),
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
        vmTemplate: this.props.vmTemplate,
        patchPrefix: this.props.patchPrefix,
        binding: getInterfaceBinding(nic),
      };
    }));
    return nics;
  }

  createNicHandler() {
    this.setState({
      newNic: {
        nicType: NIC_TYPE_CREATE,
        model: {
          value: getVmNicModel(this.props.vm),
        },
        vm: this.props.vm,
        vmTemplate: this.props.vmTemplate,
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
    const { vm, vmTemplate, patchPrefix } = this.props;
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
      binding: settingsValue(newNic, 'binding'),
    };

    const addNicPatch = getAddNicPatch(vm, nic).map(patch => addPrefixToPatch(patchPrefix, patch));

    const model = vmTemplate ? VmTemplateModel : VirtualMachineModel;
    const obj = vmTemplate || vm;

    const patch = k8sPatch(model, obj, addNicPatch);
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
    const { vm } = this.props;
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

Nic.propTypes = {
  vm: PropTypes.object.isRequired, // vm may be a template vm
  vmTemplate: PropTypes.object, // the template of the vm
  patchPrefix: PropTypes.string, // path to the vm in the template
};

Nic.defaultProps = {
  vmTemplate: null,
  patchPrefix: '',
};
