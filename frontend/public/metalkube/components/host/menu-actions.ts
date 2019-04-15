import {
  isHostPoweredOn,
  getMachineNode,
  canHostStartMaintenance,
  canHostStopMaintenance,
} from 'kubevirt-web-ui-components';

import { makeNodeSchedulable } from '../../../module/k8s';
import { Kebab } from '../utils/okdutils';
import { startMaintenanceModal } from '../modals/start-maintenance-modal';
import { confirmModal } from '../../../components/modals/confirm-modal';

const menuActionStartMaintenance = (kind, host, { machine, Node: nodes }) => {
  const node = getMachineNode(nodes, machine);
  return {
    hidden: !canHostStartMaintenance(node),
    label: 'Start Maintenance',
    callback: () => startMaintenanceModal({ resource: node }),
  };
};

const menuActionStopMaintenance = (kind, host, { machine, Node: nodes }) => {
  const node = getMachineNode(nodes, machine);
  return {
    hidden: !canHostStopMaintenance(node),
    label: 'Stop Maintenance',
    callback: () =>
      confirmModal({
        executeFn: () => makeNodeSchedulable(node),
        title: 'Stop Maintenance',
        message: 'Node will exit maintenance and start taking workloads.',
      }),
  };
};

const menuActionPowerOn = (kind, host) => ({
  hidden: isHostPoweredOn(host),
  label: 'Power On',
  callback: () => {
    // eslint-disable-next-line no-console
    console.log(host);
  },
});

const menuActionPowerOff = (kind, host) => ({
  hidden: !isHostPoweredOn(host),
  label: 'Power Off',
  callback: () => {
    // eslint-disable-next-line no-console
    console.log(host);
  },
});

export const menuActions = [
  menuActionPowerOn,
  menuActionPowerOff,
  menuActionStartMaintenance,
  menuActionStopMaintenance,
  Kebab.factory.Edit,
  Kebab.factory.Delete,
];
