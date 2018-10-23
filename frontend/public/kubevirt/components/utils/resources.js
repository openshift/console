import * as _ from 'lodash-es';
import { getCSRFToken } from '../../../co-fetch';
import { k8sBasePath } from '../../module/okdk8s';

import { VirtualMachineInstanceModel } from '../../models';

export const getResourceKind = (model, name, namespaced, namespace, isList, matchLabels, matchExpressions) => {
  let res = { kind:model.kind, namespaced, namespace, isList, prop: model.kind};
  if (name) {
    res.name = name;
  }
  if (matchLabels) {
    res.selector = {matchLabels};
  }
  if (matchExpressions) {
    res.selector = {matchExpressions};
  }
  return res;
};

export const getLabelMatcher = (vm) => _.get(vm, 'spec.template.metadata.labels');

export const findPod = (data, name) => {
  const pods = data.filter(p => p.metadata.name.startsWith(`virt-launcher-${name}-`));
  const runningPod = pods.find(p => _.get(p, 'status.phase') === 'Running' || _.get(p, 'status.phase') === 'Pending');
  return runningPod ? runningPod : pods.find(p => _.get(p, 'status.phase') === 'Failed' || _.get(p, 'status.phase') === 'Unknown');
};

export const findVMI = (data, name) => data.find(vmi => vmi.metadata.name === name);

export const getFlattenForKind = (kind) => {
  return resources => _.get(resources, kind, {}).data;
};

export const isVmiRunning = (vmi) => _.get(vmi, 'status.phase') === 'Running';

export const getVmStatus = vm => _.get(vm, 'spec.running', false) ? 'Running' : 'Stopped';

export const getVncConnectionDetails = vmi => {
  // Example: ws://localhost:9000/api/kubernetes/apis/subresources.kubevirt.io/v1alpha2/namespaces/kube-system/virtualmachineinstances/vm-cirros1/vnc
  let base = k8sBasePath;
  base = base[0] === '/' ? base.substring(1) : base; // avpid the extra slash when compose the URL by VncConsole
  const context = `${base}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;
  const apiPath = `${VirtualMachineInstanceModel.apiVersion}/namespaces/${vmi.metadata.namespace}/${VirtualMachineInstanceModel.path}/${vmi.metadata.name}`;
  const query = `?x-csrf-token=${encodeURIComponent(getCSRFToken())}`;
  const encrypt = window.location.protocol === 'https:';
  // the novnc library requires protocol to be specified so the URL must be absolute - including host:port
  return {
    encrypt, // whether ws or wss to be used
    host: window.location.hostname,
    port: window.location.port || (encrypt ? '443' : '80'),
    path: `${context}/${apiPath}/vnc${query}`
  };
};
