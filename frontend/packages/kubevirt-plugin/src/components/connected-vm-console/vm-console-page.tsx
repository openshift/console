import * as React from 'react';
import ConnectedVMConsole from '@console/kubevirt-plugin/src/components/connected-vm-console/connected-vm-console';
import { ConsoleType } from '@console/kubevirt-plugin/src/constants/vm/console-type';
import { FLAG_KUBEVIRT } from '@console/kubevirt-plugin/src/plugin';
import { useFlag } from '@console/shared/src/hooks/flag';

export const VMConsolePage: React.FC<VMConsolePageProps> = ({ match, location }) => {
  const isKubevirt = useFlag(FLAG_KUBEVIRT);
  const params = new URLSearchParams(location.search);
  const type = ConsoleType.fromString(params.get('type'));
  const { name, ns: namespace } = match.params;

  return (
    <ConnectedVMConsole isKubevirt={isKubevirt} type={type} namespace={namespace} name={name} />
  );
};

type VMConsolePageProps = {
  location: Location;
  match: any;
};
