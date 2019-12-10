/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { getName } from '@console/shared/src';
import { Wrapper } from '../common/wrapper';
import { VMKind } from '../../../types/vm';
import {
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getNetworks,
  getVolumes,
} from '../../../selectors/vm';
import { getLabels } from '../../../selectors/selectors';
import { ensurePath } from '../utils/utils';
import { VMWizardNetwork, VMWizardStorage } from '../../../components/create-vm-wizard/types';

export class VMWrapper extends Wrapper<VMKind> {
  static mergeWrappers = (...vmWrappers: VMWrapper[]): VMWrapper =>
    Wrapper.defaultMergeWrappers(VMWrapper, vmWrappers);

  static initialize = (vm?: VMKind, copy?: boolean) => new VMWrapper(vm, copy && { copy });

  protected constructor(
    vm?: VMKind,
    opts?: {
      copy?: boolean;
    },
  ) {
    super(vm, opts);
  }

  getName = () => getName(this.data);
  getLabels = (defaultValue = {}) => getLabels(this.data, defaultValue);

  getTemplateLabels = (defaultValue = {}) =>
    getLabels(_.get(this.data, 'spec.template'), defaultValue);

  getDataVolumeTemplates = (defaultValue = []) => getDataVolumeTemplates(this.data, defaultValue);

  getInterfaces = (defaultValue = []) => getInterfaces(this.data, defaultValue);

  getDisks = (defaultValue = []) => getDisks(this.data, defaultValue);

  getNetworks = (defaultValue = []) => getNetworks(this.data, defaultValue);

  getVolumes = (defaultValue = []) => getVolumes(this.data, defaultValue);
}

export class MutableVMWrapper extends VMWrapper {
  public constructor(vm?: VMKind, opts?: { copy?: boolean }) {
    super(vm, opts);
  }

  setName = (name: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.name = name;
  };

  setNamespace = (namespace: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.namespace = namespace;
  };

  addAnotation = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.annotations', {});
      this.data.metadata.annotations[key] = value;
    }
  };

  addLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.labels', {});
      this.data.metadata.labels[key] = value;
    }
  };

  addTemplateLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('spec.template.metadata.labels', {});
      this.data.spec.template.metadata.labels[key] = value;
    }
  };

  setMemory = (value: string, unit = 'G') => {
    this.ensurePath('spec.template.spec.domain.resources.requests', {});
    this.data.spec.template.spec.domain.resources.requests.memory = `${value}${unit}`;
  };

  setCPU = (cpus: string) => {
    this.ensurePath('spec.template.spec.domain.cpu', {});
    this.data.spec.template.spec.domain.cpu.cores = parseInt(cpus, 10);
  };

  setRunning = (isRunning?: boolean) => {
    this.ensurePath('spec', {});
    this.data.spec.running = !!isRunning;
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
  };

  setAutoAttachPodInterface = (autoAttach: boolean) => {
    this.ensurePath('spec.template.spec.domain.devices', {});
    this.data.spec.template.spec.domain.devices.autoattachPodInterface = autoAttach;
  };

  setHostname = (hostname: string) => {
    this.ensurePath('spec.template.spec', {});
    this.data.spec.template.spec.hostname = hostname;
  };

  ensureDataVolumeTemplates = () => this.ensurePath('spec.dataVolumeTemplates', []);

  asMutableResource = () => this.data;

  ensurePath = (path: string[] | string, value) => ensurePath(this.data, path, value);
}
