/* eslint-disable no-undef, no-unused-vars */

import * as _ from 'lodash-es';

export const getLabelMatcher = (vm) => _.get(vm, 'spec.template.metadata.labels');

export const findPod = (data, name) => {
  const pods = data.filter(p => p.metadata.name.startsWith(`virt-launcher-${name}-`));
  const runningPod = pods.find(p => _.get(p, 'status.phase') === 'Running' || _.get(p, 'status.phase') === 'Pending');
  return runningPod || pods.find(p => _.get(p, 'status.phase') === 'Failed' || _.get(p, 'status.phase') === 'Unknown');
};

export const findVMI = (data, name) => data.find(vmi => vmi.metadata.name === name);

export const getFlattenForKind = (kind) => {
  return resources => _.get(resources, [kind, 'data']);
};

export const getVMStatus = vm => _.get(vm, 'spec.running', false) ? 'Running' : 'Stopped';
