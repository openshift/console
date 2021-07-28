import { K8sResourceKind } from '@console/internal/module/k8s';
import { DEFAULT_RDP_PORT, TEMPLATE_VM_NAME_LABEL } from '../../constants/vm';
import { VMIKind } from '../../types/vm';
import { isConnectionEncrypted } from '../../utils/url';
import { getName } from '../selectors';
import { getServicePort } from '../service/selectors';
import { getVMIApiPath, getVMISubresourcePath } from './selectors';

const findVMServiceWithPort = (
  vmi: VMIKind,
  allServices: K8sResourceKind[],
  targetPort: number,
): K8sResourceKind =>
  allServices?.find(
    (service) =>
      getName(vmi) === service?.spec?.selector?.[TEMPLATE_VM_NAME_LABEL] &&
      !!getServicePort(service, targetPort),
  );

/**
 * Finds Service for the VM/VMI which is exposing the RDP port.
 * Returns undefined or single first match.
 *
 * To pair service with VM, selector must be set on the Service object:
 *   spec:
 *     selector:
 *       vm.kubevirt.io/name: VM_NAME
 *
 * https://kubevirt.io/user-guide/docs/latest/using-virtual-machines/expose-service.html
 * virtctl expose virtualmachine [VM_NAME] --name [MY_SERVICE_NAME] --port 27017 --target-port 3389
 */
export const findRDPServiceAndPort = (
  vmi: VMIKind,
  allServices: K8sResourceKind[],
): [K8sResourceKind, { protocol: string; port: number; targetPort: number; nodePort?: number }] => {
  if (!vmi) {
    return [null, null];
  }
  const service = findVMServiceWithPort(vmi, allServices, DEFAULT_RDP_PORT);
  return [service, getServicePort(service, DEFAULT_RDP_PORT)];
};

export const getSerialConsoleConnectionDetails = (
  vmi: VMIKind,
): SerialConsoleConnectionDetailsType => {
  if (!vmi) {
    return undefined;
  }

  const protocol = isConnectionEncrypted() ? 'wss' : 'ws';
  return {
    host: `${protocol}://${window.location.hostname}:${window.location.port ||
      (isConnectionEncrypted() ? '443' : '80')}`,
    path: `/${getVMISubresourcePath()}/${getVMIApiPath(vmi)}/console`, // CSRF Token will be added in WSFactory
  };
};

export const isGuestAgentConnected = (vmi: VMIKind): boolean =>
  vmi?.status?.conditions?.some(
    (condition) => condition.type === 'AgentConnected' && condition.status === 'True',
  );

export type SerialConsoleConnectionDetailsType = {
  host: string;
  path: string;
};

export type RDPConnectionDetailsManualType = {
  address: string;
  port: number | string;
};
