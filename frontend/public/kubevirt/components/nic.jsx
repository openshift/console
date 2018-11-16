import React from 'react';
import * as _ from 'lodash';
import { Cog } from './utils/okdutils';
import { List, ColHead, ListHeader, ResourceRow } from './factory/okdfactory';
import { DASHES, BUS_VIRTIO, NETWORK_TYPE_MULTUS, NETWORK_TYPE_POD, NIC } from './utils/constants';
import { deleteDeviceModal } from './modals/delete-device-modal';

const getNetworkType = network => {
  if (network) {
    if (network.hasOwnProperty('pod')){
      return NETWORK_TYPE_POD;
    } else if (network.hasOwnProperty('multus')){
      return NETWORK_TYPE_MULTUS;
    }
  }
  return DASHES;
};

const menuActionDelete = (vm, nic) => ({
  label: 'Delete',
  callback: () => deleteDeviceModal({
    type: NIC,
    device: nic,
    vm: vm,
  }),
});

const getActions = (vm, nic) => {
  const actions = [menuActionDelete];
  return actions.map(a => a(vm, nic));
};

const visibleRowStyle = 'col-lg-3 col-md-3 col-sm-3 col-xs-4';
const hiddenRowStyle = 'col-lg-3 col-md-3 col-sm-3 hidden-xs';

const NicHeader = props => <ListHeader>
  <ColHead {...props} className={visibleRowStyle} sortField="name">Name</ColHead>
  <ColHead {...props} className={visibleRowStyle} sortField="model">Model</ColHead>
  <ColHead {...props} className={visibleRowStyle} sortField="network">Network</ColHead>
  <ColHead {...props} className={hiddenRowStyle} sortField="macAddress">MAC Address</ColHead>
</ListHeader>;

export const NicRow = ({obj: nic}) => <ResourceRow obj={nic}>
  <div className={visibleRowStyle} co-resource-link-wrapper>
    {nic.name}
  </div>
  <div className={visibleRowStyle}>
    {nic.model || BUS_VIRTIO}
  </div>
  <div className={visibleRowStyle}>
    {getNetworkType(nic.network)}
  </div>
  <div className={hiddenRowStyle}>
    {nic.macAddress || DASHES}
  </div>
  <div className="co-resource-kebab">
    <Cog
      options={getActions(nic.vm, nic)}
      key={`delete-nic-${nic.name}`}
      isDisabled={_.get(nic.vm.metadata, 'deletionTimestamp')}
      id={`cog-for-${nic.name}`}
    />
  </div>
</ResourceRow>;

export const Nic = ({obj: vm}) => {
  const interfaces = _.get(vm,'spec.template.spec.domain.devices.interfaces',[]);
  const networks = _.get(vm,'spec.template.spec.networks',[]);
  const nics = interfaces.map(i => {
    const network = networks.find(n => n.name === i.name);
    return {
      ...i,
      network,
      vm: vm,
    };
  });
  return <div className="co-m-list">
    <div className="co-m-pane__body">
      <List data={nics} Header={NicHeader} Row={NicRow} loaded={true} />
    </div>
  </div>;

};
