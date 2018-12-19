import * as _ from 'lodash-es';
import { getCSRFToken } from '../../../co-fetch';
import { k8sBasePath } from '../../module/okdk8s';

import { VirtualMachineInstanceModel } from '../../models';

export const getResourceKind = (model, name, namespaced, namespace, isList, matchLabels, matchExpressions) => {
  const res = { kind:model.kind, namespaced, namespace, isList, prop: model.kind};
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

export const findPod = (data, vmName, podNamePrefix) => {
  if (!data) {
    return null;
  }
  const pods = data.filter(p => p.metadata.name.startsWith(`${podNamePrefix}${vmName}-`));
  const runningPod = pods.find(p => _.get(p, 'status.phase') === 'Running' || _.get(p, 'status.phase') === 'Pending');
  return runningPod ? runningPod : pods.find(p => _.get(p, 'status.phase') === 'Failed' || _.get(p, 'status.phase') === 'Unknown');
};

export const findVMIMigration = (data, vmiName) => {
  if (!data || !data.items) {
    return null;
  }
  const migrations = data.items.filter(m => m.spec.vmiName === vmiName);
  return migrations.find(m => !_.get(m, 'status.completed') && !_.get(m, 'status.failed') );
};

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
  // the novnc library requires protocol to be specified so the URL must be absolute - including host:port
  return {
    encrypt: isEncrypted(), // whether ws or wss to be used
    host: window.location.hostname,
    port: window.location.port || (isEncrypted() ? '443' : '80'),

    // Example: ws://localhost:9000/api/kubernetes/apis/subresources.kubevirt.io/v1alpha2/namespaces/kube-system/virtualmachineinstances/vm-cirros1/vnc
    path: `${getConsoleApiContext()}/${getConsoleApiPath(vmi)}/vnc${getConsoleApiQuery()}`,
  };
};

export const getSerialConsoleConnectionDetails = vmi => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return {
    vmi,
    host: `${protocol}://${window.location.hostname}:${window.location.port || (isEncrypted() ? '443' : '80')}`,
    path: `/${getConsoleApiContext()}/${getConsoleApiPath(vmi)}/console`, // CSRF Token will be added in WSFactory
  };
};
