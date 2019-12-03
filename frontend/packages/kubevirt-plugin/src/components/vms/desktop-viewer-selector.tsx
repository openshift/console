import * as React from 'react';
import { Form, FormGroup, Alert } from '@patternfly/react-core';
import { DesktopViewer } from '@patternfly/react-console';
import { Dropdown } from '@console/internal/components/utils';
import { getName } from '@console/shared';
import { DEFAULT_RDP_PORT, TEMPLATE_VM_NAME_LABEL, NetworkType } from '../../constants';
import { VMKind, VMIKind } from '../../types';
import { getNetworks } from '../../selectors/vm';
import {
  getVMIInterfaces,
  RDPConnectionDetailsManualType,
  VNCConnectionDetailsManualType,
} from '../../selectors/vmi';
import './desktop-viewer-selector.scss';

const SELECT_NETWORK_INTERFACE = '--- Select Network Interface ---';
const NIC = 'Network Interface';
const GUEST_AGENT_WARNING = 'Guest Agent is not installed on Virtual Machine';
const GUEST_AGENT_WARNING_TITLE = 'Missing Guest Agent';
const NO_IP_ADDRESS = 'No IP address is reported for network interface';
const NO_IP_ADDRESS_TITLE = 'Networks misconfigured';

const getVmRdpNetworks = (vm: VMKind, vmi: VMIKind): Network[] => {
  const networks = getNetworks(vm).filter((n) => n.multus || n.pod);
  return getVMIInterfaces(vmi)
    .filter((i) => networks.some((n) => n.name === i.name))
    .map((i) => {
      let ip = i.ipAddress;
      if (i.ipAddress) {
        const subnetIndex = i.ipAddress.indexOf('/');
        if (subnetIndex > 0) {
          ip = i.ipAddress.slice(0, subnetIndex);
        }
      }
      const network = networks.find((n) => n.name === i.name);
      return {
        name: i.name,
        type: network.multus ? NetworkType.MULTUS : NetworkType.POD,
        ip,
      };
    });
};

const getDefaultNetwork = (networks: Network[]) => {
  if (networks.length === 1) {
    return networks[0];
  }
  if (networks.length > 1) {
    return (
      networks.find((n) => n.type === NetworkType.POD && n.ip) ||
      networks.find((n) => n.type === NetworkType.MULTUS)
    );
  }
  return null;
};

const RdpServiceNotConfigured: React.FC<RdpServiceNotConfiguredProps> = ({ vm }) => (
  <div className="kubevirt-vm-consoles__rdp">
    <span>
      This is a Windows virtual machine but no Service for the RDP (Remote Desktop Protocol) can be
      found.
    </span>
    <br />
    <span>
      For better experience accessing Windows console, it is recommended to use the RDP. To do so,
      create a service:
      <ul>
        <li>
          exposing the{' '}
          <b>
            {DEFAULT_RDP_PORT}
            /tcp
          </b>{' '}
          port of the virtual machine
        </li>
        <li>
          using selector:{' '}
          <b>
            {TEMPLATE_VM_NAME_LABEL}: {getName(vm)}
          </b>
        </li>
        <li>
          Example: virtctl expose virtualmachine {getName(vm)} --name {getName(vm)}
          -rdp --port [UNIQUE_PORT] --target-port {DEFAULT_RDP_PORT} --type NodePort
        </li>
      </ul>
      Make sure, the VM object has <b>spec.template.metadata.labels</b> set to{' '}
      <b>
        {TEMPLATE_VM_NAME_LABEL}: {getName(vm)}
      </b>
    </span>
  </div>
);

export const DesktopViewerSelector: React.FC<DesktopViewerSelectorProps> = (props) => {
  const { vm, vmi, guestAgent, rdpServiceManual, vncServiceManual } = props;

  const networks = React.useMemo(() => getVmRdpNetworks(vm, vmi), [vm, vmi]);
  const networkItems = networks.reduce((result, network) => {
    result[network.name] = network.name;
    return result;
  }, {});
  const [selectedNetwork, setSelectedNetwork] = React.useState(getDefaultNetwork(networks));

  const onNetworkChange = React.useCallback(
    (newValue) => {
      const selected = networks.find((n) => n.name === newValue);
      setSelectedNetwork(selected);
    },
    [networks],
  );

  let content = null;
  const networkType = selectedNetwork && selectedNetwork.type;
  switch (networkType) {
    case NetworkType.MULTUS:
      if (!guestAgent) {
        content = (
          <Alert variant="warning" isInline title={GUEST_AGENT_WARNING_TITLE}>
            {GUEST_AGENT_WARNING}
          </Alert>
        );
      } else if (!selectedNetwork || !selectedNetwork.ip) {
        content = (
          <Alert variant="warning" isInline title={NO_IP_ADDRESS_TITLE}>{`${NO_IP_ADDRESS} ${
            selectedNetwork ? selectedNetwork.name : ''
          }`}</Alert>
        );
      } else {
        const rdp = {
          address: selectedNetwork.ip,
          port: DEFAULT_RDP_PORT,
        };
        content = <DesktopViewer rdp={rdp} />;
      }
      break;
    case NetworkType.POD:
      content =
        rdpServiceManual || vncServiceManual ? (
          <DesktopViewer rdp={rdpServiceManual} vnc={vncServiceManual} />
        ) : (
          <RdpServiceNotConfigured vm={vm} />
        );
      break;
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unknown network interface type ${networkType}`);
  }

  return (
    <div className="kubevirt-desktop-viewer-selector">
      <Form isHorizontal>
        <FormGroup
          className="kubevirt-desktop-viewer-selector__form-group"
          fieldId="network-dropdown"
          label={NIC}
        >
          <Dropdown
            id="network-dropdown"
            onChange={onNetworkChange}
            items={networkItems}
            selectedKey={selectedNetwork ? selectedNetwork.name : undefined}
            title={SELECT_NETWORK_INTERFACE}
          />
        </FormGroup>
      </Form>
      {content}
    </div>
  );
};
DesktopViewerSelector.displayName = 'DesktopViewer';

type DesktopViewerSelectorProps = {
  vm: VMKind;
  vmi: VMIKind;
  guestAgent: boolean;
  rdpServiceManual: RDPConnectionDetailsManualType;
  vncServiceManual: VNCConnectionDetailsManualType;
};

type RdpServiceNotConfiguredProps = {
  vm: VMKind;
};

type Network = {
  name: string;
  type: NetworkType;
  ip: string;
};
