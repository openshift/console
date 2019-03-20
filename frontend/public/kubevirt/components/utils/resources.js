/* eslint-disable no-console */
import * as _ from 'lodash-es';
import { getCSRFToken } from '../../../co-fetch';
import { k8sBasePath } from '../../module/okdk8s';

import { VirtualMachineInstanceModel } from '../../models';
import {
  TEMPLATE_VM_NAME_LABEL,
  DEFAULT_RDP_PORT,
  CDI_KUBEVIRT_IO,
  STORAGE_IMPORT_PVC_NAME,
  isMigrating,
} from 'kubevirt-web-ui-components';

export const getLabelMatcher = (vm) => _.get(vm, 'spec.template.metadata.labels');

export const findPod = (data, vmName, podNamePrefix) => {
  if (!data) {
    return null;
  }
  const pods = data.filter(p => p.metadata.name.startsWith(`${podNamePrefix}${vmName}-`));
  const runningPod = pods.find(p => _.get(p, 'status.phase') === 'Running' || _.get(p, 'status.phase') === 'Pending');
  return runningPod ? runningPod : pods.find(p => _.get(p, 'status.phase') === 'Failed' || _.get(p, 'status.phase') === 'Unknown');
};

export const findImporterPods = (data, vm) => {
  if (!data) {
    return null;
  }

  const dataVolumeTemplates = _.get(vm, 'spec.dataVolumeTemplates', []);

  const datavolumeNames = dataVolumeTemplates.map(dataVolumeTemplate => _.get(dataVolumeTemplate, 'metadata.name', null))
    .filter(dataVolumeTemplate => dataVolumeTemplate);

  return data.filter(p => datavolumeNames.find(name => p.metadata.labels[`${CDI_KUBEVIRT_IO}/${STORAGE_IMPORT_PVC_NAME}`] === name ) );
};

export const findVMIMigration = (migrations, vmiName) => {
  if (!migrations) {
    return null;
  }

  return migrations.filter(m => m.spec.vmiName === vmiName)
    .find(isMigrating);
};

const findPortOfService = (service, targetPort) => _.get(service, ['spec', 'ports'], [])
  .find(servicePort => targetPort === servicePort.targetPort);

/*
 See web-ui-components, request.js:addMetadata() for automatic VM name label addition to match the selector
 */
const findVMServiceWithPort = (vmi, allServices, targetPort) => (allServices || [])
  .find(service =>
    _.get(vmi, 'metadata.name') === _.get(service, ['spec', 'selector', TEMPLATE_VM_NAME_LABEL])
    && !!findPortOfService(service, targetPort)
  );

export const getFlattenForKind = (kind) => {
  return resources => _.get(resources, kind, {}).data;
};

const getApiConsoleApiBase = () => {
  let base = k8sBasePath;
  base = base[0] === '/' ? base.substring(1) : base; // avoid the extra slash when compose the URL by VncConsole
  return base;
};

const getConsoleApiContext = () => `${getApiConsoleApiBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;
const getConsoleApiPath = vmi => `${VirtualMachineInstanceModel.apiVersion}/namespaces/${vmi.metadata.namespace}/${VirtualMachineInstanceModel.path}/${vmi.metadata.name}`;
const getConsoleApiQuery = () => `?x-csrf-token=${encodeURIComponent(getCSRFToken())}`;
const isEncrypted = () => window.location.protocol === 'https:';

export const getVncConnectionDetails = vmi => {
  if (!vmi) {
    return undefined;
  }

  // the novnc library requires protocol to be specified so the URL must be absolute - including host:port
  return {
    encrypt: isEncrypted(), // whether ws or wss to be used
    host: window.location.hostname,
    port: window.location.port || (isEncrypted() ? '443' : '80'),

    // Example: ws://localhost:9000/api/kubernetes/apis/subresources.kubevirt.io/v1alpha3/namespaces/kube-system/virtualmachineinstances/vm-cirros1/vnc
    path: `${getConsoleApiContext()}/${getConsoleApiPath(vmi)}/vnc${getConsoleApiQuery()}`,

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

export const getSerialConsoleConnectionDetails = vmi => {
  if (!vmi) {
    return undefined;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return {
    vmi,
    host: `${protocol}://${window.location.hostname}:${window.location.port || (isEncrypted() ? '443' : '80')}`,
    path: `/${getConsoleApiContext()}/${getConsoleApiPath(vmi)}/console`, // CSRF Token will be added in WSFactory
  };
};

const getRdpAddressPort = (rdpService, launcherPod) => {
  const rdpPortObj = findPortOfService(rdpService, DEFAULT_RDP_PORT);
  if (!rdpPortObj) {
    return null;
  }

  let port = _.get(rdpPortObj, 'port');
  let address;
  switch (_.get(rdpService, 'spec.type')) {
    case 'LoadBalancer':
      address = _.get(rdpService, 'spec.externalIPs[0]');
      if (!address) {
        console.warn('External IP is not defined for the LoadBalancer RDP Service: ', rdpService);
      }
      break;
    case 'ClusterIP':
      address = _.get(rdpService, 'spec.clusterIP');
      if (!address) {
        console.warn('Cluster IP is not defined for the ClusterIP RDP Service: ', rdpService);
      }
      break;
    case 'NodePort':
      port = _.get(rdpPortObj, 'nodePort');
      if (launcherPod) {
        address = _.get(launcherPod, 'status.hostIP');
      }
      if (!address) {
        console.warn('Node IP (launcherpod.status.hostIP) is not yet known for NodePort RDP Service: ', rdpService);
      }
      break;
    default:
      console.error('Unrecognized Service type: ', rdpService);
  }

  if (!address || !port) {
    return null;
  }

  console.log('RDP requested for: ', address, port);
  return {
    address,
    port,
  };
};

/**
 * Finds Service for the VM/VMI which is exposing the RDP port.
 * Returns undefined or single first match.
 *
 * To pair service with VM, selector must be set on the Service object:
 *   spec:
 *     selector:
 *       vm.cnv.io/name: VM_NAME
 *
 * https://kubevirt.io/user-guide/docs/latest/using-virtual-machines/expose-service.html
 * virtctl expose virtualmachine [VM_NAME] --name [MY_SERVICE_NAME] --port 27017 --target-port 3389
 */
export const findRDPService = (vmi, allServices) => findVMServiceWithPort(vmi, allServices, DEFAULT_RDP_PORT);

export const getRdpConnectionDetails = (vmi, rdpService, launcherPod) => {
  if (!vmi || !rdpService) {
    return undefined;
  }

  return {
    vmi,
    manual: getRdpAddressPort(rdpService, launcherPod),
  };
};

