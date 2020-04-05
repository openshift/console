import * as _ from 'lodash';
import { alignWithDNS1123 } from '@console/shared/src';
import { InternalActionType, UpdateOptions } from '../../../../types';
import {
  OvirtProviderField,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkType,
} from '../../../../../types';
import { vmWizardInternalActions } from '../../../../internal-actions';
import {
  CUSTOM_FLAVOR,
  NetworkInterfaceModel,
  NetworkInterfaceType,
} from '../../../../../../../constants/vm';
import { NetworkWrapper } from '../../../../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../../../../k8s/wrapper/vm/network-interface-wrapper';
import { BinaryUnit, convertToHighestUnit } from '../../../../../../form/size-unit-utils';
import { OvirtVM } from '../../../../../../../types/vm-import/ovirt/ovirt-vm';
import { iGetOvirtFieldAttribute } from '../../../../../selectors/immutable/provider/ovirt/selectors';

export const getNics = (vm: OvirtVM): VMWizardNetwork[] => {
  return (vm.nics || [])
    .filter((n) => n)
    .map((nic, idx) => {
      const name = alignWithDNS1123(nic.name);

      return {
        id: `${nic.id}-${idx + 1}`,
        type: VMWizardNetworkType.V2V_OVIRT_IMPORT,
        network: NetworkWrapper.initializeFromSimpleData({ name }).asResource(),
        networkInterface: NetworkInterfaceWrapper.initializeFromSimpleData({
          name,
          model: NetworkInterfaceModel.fromString(nic.interface),
          macAddress: nic.mac,
          interfaceType: NetworkInterfaceType.BRIDGE,
        }).asResource(),
        editConfig: {
          disableEditing: true,
          isFieldEditableOverride: {
            network: true,
          },
        },
      };
    });
};

const getWorkload = (vm: OvirtVM) => {
  return vm?.vmtype?.replace('_', '') || 'server';
};

const getCPU = (vm: OvirtVM) => {
  const { cores = 1, cpusockets = 1, cputhreads = 1 } = vm?.cpu || {};
  return cpusockets * cores * cputhreads;
};

const getOS = (vm: OvirtVM) => {
  const { osdist, ostype, osversion } = vm?.os || {};

  const result = ostype || (osdist ? `${osdist}${osversion || ''}` : 'Unknown');

  return _.capitalize(result.replace('_', ' '));
};

// update checks done in ovirt-state-update
export const prefillUpdateCreator = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const iVM = iGetOvirtFieldAttribute(state, id, OvirtProviderField.VM, 'vm');
  const vm: OvirtVM = JSON.parse(iVM.getIn(['detail', 'raw'])) || {};

  const { memory, name } = vm;

  const memWithUnit = memory ? convertToHighestUnit(memory, BinaryUnit.B) : null;

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.NAME]: {
        value: alignWithDNS1123(name),
      },
      [VMSettingsField.MEMORY]: {
        value: memWithUnit ? `${memWithUnit.value}${memWithUnit.unit}` : null,
      },
      [VMSettingsField.CPU]: {
        value: getCPU(vm),
      },
      [VMSettingsField.OPERATING_SYSTEM]: {
        display: getOS(vm),
      },
      [VMSettingsField.FLAVOR]: {
        value: CUSTOM_FLAVOR,
      },
      [VMSettingsField.WORKLOAD_PROFILE]: {
        value: getWorkload(vm),
      },
    }),
  );
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, getNics(vm)));
};
