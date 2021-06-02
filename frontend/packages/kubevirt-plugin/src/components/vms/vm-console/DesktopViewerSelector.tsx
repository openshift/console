import * as React from 'react';
import { DesktopViewer } from '@patternfly/react-console';
import { Alert, Form, FormGroup } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ServiceModel } from '@console/internal/models';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { DEFAULT_RDP_PORT, NetworkType, TEMPLATE_VM_NAME_LABEL } from '../../../constants';
import { getRdpAddressPort } from '../../../selectors/service';
import { getNetworks } from '../../../selectors/vm';
import { getVMIAvailableStatusInterfaces, isGuestAgentConnected } from '../../../selectors/vmi';
import { VMIKind, VMKind } from '../../../types';

import './desktop-viewer-selector.scss';

const SELECT_NETWORK_INTERFACE = '--- Select Network Interface ---';
const NIC = 'Network Interface';
const GUEST_AGENT_WARNING = 'Guest Agent is not installed on Virtual Machine';
const GUEST_AGENT_WARNING_TITLE = 'Missing Guest Agent';
const NO_IP_ADDRESS = 'No IP address is reported for network interface';
const NO_IP_ADDRESS_TITLE = 'Networks misconfigured';

const getVmRdpNetworks = (vm: VMKind, vmi: VMIKind): Network[] => {
  const networks = getNetworks(vm).filter((n) => n.multus || n.pod);
  return getVMIAvailableStatusInterfaces(vmi)
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

const RdpServiceNotConfigured: React.FC<RdpServiceNotConfiguredProps> = ({ vm }) => {
  const name = vm?.metadata?.name;
  return (
    <div data-test="rdp-console-desc">
      <span>
        This is a Windows virtual machine but no Service for the RDP (Remote Desktop Protocol) can
        be found.
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
              {TEMPLATE_VM_NAME_LABEL}: {name}
            </b>
          </li>
          <li>
            Example: virtctl expose virtualmachine {name} --name {name}
            -rdp --port [UNIQUE_PORT] --target-port {DEFAULT_RDP_PORT} --type NodePort
          </li>
        </ul>
        Make sure, the VM object has <b>spec.template.metadata.labels</b> set to{' '}
        <b>
          {TEMPLATE_VM_NAME_LABEL}: {name}
        </b>
      </span>
    </div>
  );
};

const DesktopViewerSelector: React.FC<DesktopViewerSelectorProps> = (props) => {
  const { vm, vmi, vmPod } = props;

  // We probably can not simply match on labels but on Service's spec.selector.[kubevirt/vm] to achieve robust pairing VM-Service.
  // So read all services and filter on frontend.
  const [services] = useK8sWatchResource<K8sResourceKind[]>(
    vm?.metadata?.namespace
      ? {
          kind: ServiceModel.kind,
          isList: true,
          namespace: vm.metadata.namespace,
        }
      : null,
  );

  const rdpServiceAddressPort = getRdpAddressPort(vmi, services, vmPod);

  const guestAgent = isGuestAgentConnected(vmi);
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
      content = rdpServiceAddressPort ? (
        <DesktopViewer rdp={rdpServiceAddressPort} />
      ) : (
        <RdpServiceNotConfigured vm={vm} />
      );
      break;
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unknown network interface type ${networkType}`);
  }

  return (
    <>
      <Form isHorizontal className="kv-vm-consoles__rdp-actions">
        <FormGroup fieldId="network-dropdown" label={NIC}>
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
    </>
  );
};
DesktopViewerSelector.displayName = 'DesktopViewer';

type DesktopViewerSelectorProps = {
  vm: VMKind;
  vmi: VMIKind;
  vmPod: PodKind;
};

type RdpServiceNotConfiguredProps = {
  vm: VMKind;
};

type Network = {
  name: string;
  type: NetworkType;
  ip: string;
};

export default DesktopViewerSelector;
