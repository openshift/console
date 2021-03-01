import * as React from 'react';
import { VncConsole, constants } from '@patternfly/react-console';

import { getVMIApiPath, getVMISubresourcePath } from '../../../../selectors/vmi';
import { isConnectionEncrypted } from '../../../../utils/url';
import { VMIKind } from '../../../../types';

const VncConsoleConnector: React.FC<VncConsoleConnectorProps> = ({ vmi }) => (
  // the novnc library requires protocol to be specified so the URL must be absolute - including host:port
  <VncConsole
    encrypt={isConnectionEncrypted()}
    host={window.location.hostname}
    port={window.location.port || (isConnectionEncrypted() ? '443' : '80')}
    // Example: ws://localhost:9000/api/kubernetes/apis/subresources.kubevirt.io/v1alpha3/namespaces/kube-system/virtualmachineinstances/vm-cirros1/vnc
    path={`${getVMISubresourcePath()}/${getVMIApiPath(vmi)}/vnc`}
  />
);

type VncConsoleConnectorProps = {
  vmi: VMIKind;
};

VncConsoleConnector.displayName = constants.VNC_CONSOLE_TYPE; // for child-recognition by AccessConsoles

export default VncConsoleConnector;
