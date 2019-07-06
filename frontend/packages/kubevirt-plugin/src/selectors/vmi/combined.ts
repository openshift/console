import * as _ from 'lodash';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { getServicePort } from '../service';
import { VMIKind } from '../../types/vm';
import { DEFAULT_RDP_PORT, TEMPLATE_VM_NAME_LABEL } from '../../constants/vm';
import { getRdpAddressPort } from '../service/rdp';
import { isConnectionEncrypted } from '../../utils/url';
import { getVMIApiPath, getVMIApiQuery, getVMISubresourcePath } from './selectors';

/*
 See web-ui-components, request.js:addMetadata() for automatic VM name label addition to match the selector
 */
const findVMServiceWithPort = (vmi: VMIKind, allServices: K8sResourceKind[], targetPort: number) =>
  (allServices || []).find(
    (service) =>
      getName(vmi) === _.get(service, ['spec', 'selector', TEMPLATE_VM_NAME_LABEL]) &&
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
export const findRDPService = (vmi: VMIKind, allServices: K8sResourceKind[]) =>
  findVMServiceWithPort(vmi, allServices, DEFAULT_RDP_PORT);

export const getRdpConnectionDetails = (
  vmi: VMIKind,
  rdpService: K8sResourceKind,
  launcherPod: PodKind,
) => {
  if (!vmi || !rdpService) {
    return undefined;
  }

  return {
    vmi,
    manual: getRdpAddressPort(rdpService, launcherPod),
  };
};

export const getSerialConsoleConnectionDetails = (vmi: VMIKind) => {
  if (!vmi) {
    return undefined;
  }

  const protocol = isConnectionEncrypted() ? 'wss' : 'ws';
  return {
    vmi,
    host: `${protocol}://${window.location.hostname}:${window.location.port ||
      (isConnectionEncrypted() ? '443' : '80')}`,
    path: `/${getVMISubresourcePath()}/${getVMIApiPath(vmi)}/console`, // CSRF Token will be added in WSFactory
  };
};

export const getVncConnectionDetails = (vmi: VMIKind) => {
  if (!vmi) {
    return undefined;
  }

  // the novnc library requires protocol to be specified so the URL must be absolute - including host:port
  return {
    encrypt: isConnectionEncrypted(), // whether ws or wss to be used
    host: window.location.hostname,
    port: window.location.port || (isConnectionEncrypted() ? '443' : '80'),

    // Example: ws://localhost:9000/api/kubernetes/apis/subresources.kubevirt.io/v1alpha3/namespaces/kube-system/virtualmachineinstances/vm-cirros1/vnc
    path: `${getVMISubresourcePath()}/${getVMIApiPath(vmi)}/vnc${getVMIApiQuery()}`,

    manual: undefined, // so far unsupported
    /* TODO: Desktop viewer connection needs general agreement by the Kubevirt community how to expose the VNC port for clients without WS
      {
      address: 'Service not exposed',
      port: undefined,
      tlsPort: undefined,
    },
    */
  };
};
