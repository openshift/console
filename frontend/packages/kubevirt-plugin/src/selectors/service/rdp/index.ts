/* eslint-disable no-console */
import * as _ from 'lodash';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { DEFAULT_RDP_PORT } from '../../../constants/vm';
import { getServicePort } from '../selectors';

export const getRdpAddressPort = (rdpService: K8sResourceKind, launcherPod: PodKind) => {
  const rdpPortObj = getServicePort(rdpService, DEFAULT_RDP_PORT);
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
