/* eslint-disable no-console */
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { VMIKind } from '../../../types';
import { findRDPServiceAndPort } from '../../vmi';

export const getRdpAddressPort = (
  vmi: VMIKind,
  services: K8sResourceKind[],
  launcherPod: PodKind,
) => {
  const [rdpService, rdpPortObj] = findRDPServiceAndPort(vmi, services);
  if (!rdpService || !rdpPortObj) {
    return null;
  }

  let { port } = rdpPortObj;
  let address: number;
  switch (rdpService.spec?.type) {
    case 'LoadBalancer':
      address = rdpService.spec.externalIPs?.[0];
      if (!address) {
        console.warn('External IP is not defined for the LoadBalancer RDP Service: ', rdpService);
      }
      break;
    case 'ClusterIP':
      address = rdpService.spec.clusterIP;
      if (!address) {
        console.warn('Cluster IP is not defined for the ClusterIP RDP Service: ', rdpService);
      }
      break;
    case 'NodePort':
      port = rdpPortObj.nodePort;
      if (launcherPod) {
        address = launcherPod.status?.hostIP;
      }
      if (!address) {
        console.warn(
          'Node IP (launcherpod.status.hostIP) is not yet known for NodePort RDP Service: ',
          rdpService,
        );
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
