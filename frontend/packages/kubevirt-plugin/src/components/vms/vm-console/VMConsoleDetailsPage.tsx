import * as React from 'react';
import { ConsoleType } from '../../../constants/vm/console-type';
import { useRenderVNCConsole } from '../../../hooks/use-render-vnc-console';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../../models';
import { isVM, isVMI } from '../../../selectors/check-type';
import { getVMStatus } from '../../../statuses/vm/vm-status';
import { VMTabProps } from '../types';
import VMConsoles from './VMConsoles';

const VMConsolePage: React.FC<VMTabProps> = ({
  obj,
  vm: vmProp,
  vmis: vmisProp,
  vmImports,
  pods,
  migrations,
  pvcs,
  dataVolumes,
  customData: { kindObj },
  showOpenInNewWindow,
}) => {
  const vm = kindObj === VirtualMachineModel && isVM(obj) ? obj : vmProp;
  const vmi = kindObj === VirtualMachineInstanceModel && isVMI(obj) ? obj : vmisProp[0];
  const params = new URLSearchParams(window.location.search);
  const type = ConsoleType.fromString(params.get('type'));
  const renderVNCConsole = useRenderVNCConsole({
    vmName: obj?.metadata?.name,
    shouldBeFullScreen: false,
  });

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  });

  return (
    <div className="co-m-pane__body">
      <VMConsoles
        vm={vm}
        vmi={vmi}
        vmStatusBundle={vmStatusBundle}
        type={type}
        showOpenInNewWindow={showOpenInNewWindow}
        renderVNCConsole={renderVNCConsole}
      />
    </div>
  );
};

export default VMConsolePage;
