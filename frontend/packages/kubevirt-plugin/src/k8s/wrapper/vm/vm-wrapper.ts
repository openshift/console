/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { getLabels } from '@console/shared/src';
import { apiVersionForModel, K8sKind } from '@console/internal/module/k8s';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { CPURaw, VMKind } from '../../../types/vm';
import {
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getNetworks,
  getVolumes,
  isDedicatedCPUPlacement,
} from '../../../selectors/vm/selectors';
import { ensurePath } from '../utils/utils';
import { VMWizardNetwork, VMWizardStorage } from '../../../components/create-vm-wizard/types';
import { VMILikeMethods } from './types';
import { transformDevices } from '../../../selectors/vm';
import { findKeySuffixValue } from '../../../selectors/utils';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../constants/vm';

export class VMWrapper extends K8sResourceWrapper<VMKind> implements VMILikeMethods {
  static mergeWrappers = (...vmWrappers: VMWrapper[]): VMWrapper =>
    K8sResourceWrapper.defaultMergeWrappers(VMWrapper, vmWrappers);

  static initialize = (vm?: VMKind, copy?: boolean) => new VMWrapper(vm, copy && { copy });

  protected constructor(
    vm?: VMKind,
    opts?: {
      copy?: boolean;
    },
  ) {
    super(vm, opts);
  }

  hasTemplateLabel = (label: string) => _.has(this.getTemplateLabels(null), label);

  getOperatingSystem = () => findKeySuffixValue(this.getLabels(), TEMPLATE_OS_LABEL);
  getWorkloadProfile = () => findKeySuffixValue(this.getLabels(), TEMPLATE_WORKLOAD_LABEL);
  getFlavor = () => findKeySuffixValue(this.getLabels(), TEMPLATE_FLAVOR_LABEL);

  getMemory = () => this.data?.spec?.template?.spec?.domain?.resources?.requests?.memory;
  getCPU = (): CPURaw => this.data?.spec?.template?.spec?.domain?.cpu;

  getTemplateLabels = (defaultValue = {}) =>
    getLabels(_.get(this.data, 'spec.template'), defaultValue);

  getDataVolumeTemplates = (defaultValue = []) => getDataVolumeTemplates(this.data, defaultValue);

  getInterfaces = (defaultValue = []) => getInterfaces(this.data, defaultValue);

  getDisks = (defaultValue = []) => getDisks(this.data, defaultValue);
  getCDROMs = () => this.getDisks().filter((device) => !!device.cdrom);

  getNetworks = (defaultValue = []) => getNetworks(this.data, defaultValue);

  getVolumes = (defaultValue = []) => getVolumes(this.data, defaultValue);

  getLabeledDevices = () => transformDevices(this.getDisks(), this.getInterfaces());

  isDedicatedCPUPlacement = () => isDedicatedCPUPlacement(this.data);
}

export class MutableVMWrapper extends VMWrapper {
  public constructor(vm?: VMKind, opts?: { copy?: boolean }) {
    super(vm, opts);
  }

  setName = (name: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.name = name;
    return this;
  };

  setNamespace = (namespace: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.namespace = namespace;
    return this;
  };

  setModel = (model: K8sKind) => {
    this.data.kind = model.kind;
    this.data.apiVersion = apiVersionForModel(model);
    return this;
  };

  addAnotation = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.annotations', {});
      this.data.metadata.annotations[key] = value;
    }
    return this;
  };

  addLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.labels', {});
      this.data.metadata.labels[key] = value;
    }
    return this;
  };

  addTemplateLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('spec.template.metadata.labels', {});
      this.data.spec.template.metadata.labels[key] = value;
    }
    return this;
  };

  addTemplateAnnotation = (key: string, value: string) => {
    if (key) {
      this.ensurePath('spec.template.metadata.annotations', {});
      this.data.spec.template.metadata.annotations[key] = value;
    }
    return this;
  };

  setMemory = (value: string, unit = 'Gi') => {
    this.ensurePath('spec.template.spec.domain.resources.requests', {});
    this.data.spec.template.spec.domain.resources.requests.memory = `${value}${unit}`;
    return this;
  };

  setCPU = (cpus: string) => {
    this.ensurePath('spec.template.spec.domain.cpu', {});
    this.data.spec.template.spec.domain.cpu.cores = parseInt(cpus, 10);
    return this;
  };

  setRunning = (isRunning?: boolean) => {
    this.ensurePath('spec', {});
    this.data.spec.running = !!isRunning;
    return this;
  };

  setNetworks = (networks: VMWizardNetwork[]) => {
    this.ensurePath('spec.template.spec.domain.devices', {});
    this.data.spec.template.spec.domain.devices.interfaces = _.compact(
      networks.map((network) => network.networkInterface),
    );
    this.data.spec.template.spec.networks = _.compact(networks.map((network) => network.network));

    if (_.isEmpty(this.getInterfaces())) {
      delete this.data.spec.template.spec.domain.devices.interfaces;
    }
    if (_.isEmpty(this.getNetworks())) {
      delete this.data.spec.template.spec.networks;
    }
    return this;
  };

  setStorages = (storages: VMWizardStorage[]) => {
    this.ensurePath('spec.template.spec.domain.devices', {});
    this.data.spec.template.spec.domain.devices.disks = _.compact(
      storages.map((storage) => storage.disk),
    );
    this.data.spec.template.spec.volumes = _.compact(storages.map((storage) => storage.volume));
    this.data.spec.dataVolumeTemplates = _.compact(storages.map((storage) => storage.dataVolume));

    if (_.isEmpty(this.getDisks())) {
      delete this.data.spec.template.spec.domain.devices.disks;
    }
    if (_.isEmpty(this.getVolumes())) {
      delete this.data.spec.template.spec.volumes;
    }
    if (_.isEmpty(this.getDataVolumeTemplates())) {
      delete this.data.spec.dataVolumeTemplates;
    }
    return this;
  };

  setAutoAttachPodInterface = (autoAttach: boolean) => {
    this.ensurePath('spec.template.spec.domain.devices', {});
    this.data.spec.template.spec.domain.devices.autoattachPodInterface = autoAttach;
    return this;
  };

  setHostname = (hostname: string) => {
    this.ensurePath('spec.template.spec', {});
    this.data.spec.template.spec.hostname = hostname;
    return this;
  };

  ensureDataVolumeTemplates = () => this.ensurePath('spec.dataVolumeTemplates', []);

  asMutableResource = () => this.data;

  ensurePath = (path: string[] | string, value) => ensurePath(this.data, path, value);
}
