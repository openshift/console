/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { getLabels } from '@console/shared/src/selectors/common';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { CPURaw, V1NetworkInterface, VMKind } from '../../../types/vm';
import {
  getCloudInitVolume,
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getNetworks,
  getVolumes,
  isDedicatedCPUPlacement,
  getNodeSelector,
  getTolerations,
  getAffinity,
} from '../../../selectors/vm/selectors';
import { VMWizardNetwork, VMWizardStorage } from '../../../components/create-vm-wizard/types';
import { VMILikeMethods } from './types';
import { findKeySuffixValue } from '../../../selectors/utils';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
  VolumeType,
} from '../../../constants/vm';
import { VolumeWrapper } from './volume-wrapper';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { VirtualMachineImportModel, VirtualMachineModel } from '../../../models';
import { buildOwnerReferenceForModel } from '../../../utils';
import { transformDevices } from '../../../selectors/vm/devices';

export class VMWrapper extends K8sResourceWrapper<VMKind, VMWrapper> implements VMILikeMethods {
  constructor(vm?: VMKind | VMWrapper | any, copy = false) {
    super(VirtualMachineModel, vm, copy);
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

  getNetworkInterfaces = (defaultValue = []) => getInterfaces(this.data, defaultValue);

  getDisks = (defaultValue = []) => getDisks(this.data, defaultValue);
  getCDROMs = () => this.getDisks().filter((device) => !!device.cdrom);

  getNetworks = (defaultValue = []) => getNetworks(this.data, defaultValue);

  getVolumes = (defaultValue = []) => getVolumes(this.data, defaultValue);

  getVolumesOfDisks = (disks: V1Disk[]): V1Volume[] => {
    const diskNames = disks.map((disk) => disk?.name);
    return this.getVolumes().filter((vol) => diskNames.includes(vol.name));
  };

  getLabeledDevices = () => transformDevices(this.getDisks(), this.getNetworkInterfaces());

  getNodeSelector = () => getNodeSelector(this.data);

  getTolerations = () => getTolerations(this.data);

  getVolumesByType = (volType: VolumeType): V1Volume[] =>
    this.getVolumes().filter((vol) => new VolumeWrapper(vol).getType() === volType);

  getConfigMaps = (): V1Volume[] => this.getVolumesByType(VolumeType.CONFIG_MAP);

  getSecrets = (): V1Volume[] => this.getVolumesByType(VolumeType.SECRET);

  getServiceAccounts = (): V1Volume[] => this.getVolumesByType(VolumeType.SERVICE_ACCOUNT);

  getDiskSerial = (diskName: string) => {
    const disk = this.getDisks().find((d) => d.name === diskName);
    return disk && Object.keys(disk).includes('serial') && disk.serial;
  };

  getAffinity = () => getAffinity(this.data);

  isDedicatedCPUPlacement = () => isDedicatedCPUPlacement(this.data);

  getVMImportOwnerReference = () => {
    return (this.getOwnerReferences() || []).find((reference) =>
      compareOwnerReference(
        reference,
        buildOwnerReferenceForModel(VirtualMachineImportModel),
        true,
      ),
    );
  };

  getCloudInitVolume = () => getCloudInitVolume(this.data);

  addTemplateLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('spec.template.metadata.labels');
      this.data.spec.template.metadata.labels[key] = value;
    }
    return this;
  };

  addTemplateAnnotation = (key: string, value: string) => {
    if (key) {
      this.ensurePath('spec.template.metadata.annotations');
      this.data.spec.template.metadata.annotations[key] = value;
    }
    return this;
  };

  setMemory = (value: string, suffix?: string) => {
    this.ensurePath('spec.template.spec.domain.resources.requests');
    this.data.spec.template.spec.domain.resources.requests.memory = suffix
      ? `${value}${suffix}`
      : value;
    return this;
  };

  setCPU = (cpu: { sockets: number; cores: number; threads: number }) => {
    if (cpu) {
      this.ensurePath('spec.template.spec.domain.cpu', {});
      const { sockets, cores, threads } = cpu;
      const vmCPU = this.data.spec.template.spec.domain.cpu;
      vmCPU.sockets = sockets === undefined ? vmCPU.sockets : sockets;
      vmCPU.cores = cores === undefined ? vmCPU.cores : cores;
      vmCPU.threads = threads === undefined ? vmCPU.threads : threads;
    } else if (this.data?.spec?.template?.spec?.domain) {
      delete this.data.spec.template.spec.domain.cpu;
    }
    return this;
  };

  setRunning = (isRunning?: boolean) => {
    this.ensurePath('spec');
    this.data.spec.running = !!isRunning;
    return this;
  };

  setNetworkInterfaces = (networks: V1NetworkInterface[]) => {
    this.ensurePath('spec.template.spec.domain.devices');
    this.data.spec.template.spec.domain.devices.interfaces = _.compact(networks);
    this.ensureNetworksConsistency();
    return this;
  };

  setWizardNetworks = (networks: VMWizardNetwork[]) => {
    this.ensurePath('spec.template.spec.domain.devices');
    this.data.spec.template.spec.domain.devices.interfaces = _.compact(
      networks.map((network) => network.networkInterface),
    );
    this.data.spec.template.spec.networks = _.compact(networks.map((network) => network.network));

    this.ensureNetworksConsistency();
    return this;
  };

  prependStorage = ({
    disk,
    volume,
    dataVolume,
  }: {
    disk: V1Disk;
    volume: V1Volume;
    dataVolume?: V1alpha1DataVolume;
  }) => {
    this.ensureStorages();
    this.getDisks().unshift(disk);
    this.getVolumes().unshift(volume);
    if (dataVolume) {
      this.getDataVolumeTemplates().unshift(dataVolume);
    }
    this.ensureStorageConsistency();
    return this;
  };

  removeStorage = (diskName: string) => {
    this.ensurePath('spec.template.spec.domain.devices', {});
    this.data.spec.template.spec.domain.devices.disks = this.getDisks().filter(
      (disk) => disk.name !== diskName,
    );
    const volumeWrapper = new VolumeWrapper(
      this.getVolumes().find((volume) => volume.name === diskName),
    );
    this.data.spec.template.spec.volumes = this.getVolumes().filter(
      (volume) => volume.name !== diskName,
    );

    if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
      this.data.spec.dataVolumeTemplates = this.getDataVolumeTemplates().filter(
        (dataVolume) => dataVolume.name !== volumeWrapper.getDataVolumeName(),
      );
    }

    this.ensureStorageConsistency();
    return this;
  };

  updateVolume = (volume: V1Volume) => {
    this.data.spec.template.spec.volumes = this.getVolumes().map((vol) => {
      if (volume.name === vol.name) {
        return volume;
      }
      return vol;
    });
    return this;
  };

  setWizardStorages = (storages: VMWizardStorage[]) => {
    this.ensurePath('spec.template.spec.domain.devices');
    this.data.spec.template.spec.domain.devices.disks = _.compact(
      storages.map((storage) => storage.disk),
    );
    this.data.spec.template.spec.volumes = _.compact(storages.map((storage) => storage.volume));
    this.data.spec.dataVolumeTemplates = _.compact(storages.map((storage) => storage.dataVolume));

    this.ensureStorageConsistency();
    return this;
  };

  setAutoAttachPodInterface = (autoAttach: boolean) => {
    this.ensurePath('spec.template.spec.domain.devices');
    this.data.spec.template.spec.domain.devices.autoattachPodInterface = autoAttach;
    return this;
  };

  setHostname = (hostname: string) => {
    this.ensurePath('spec.template.spec');
    this.data.spec.template.spec.hostname = hostname;
    return this;
  };

  ensureDataVolumeTemplates = () => this.ensurePath('spec.dataVolumeTemplates', []);

  private ensureStorages = () => {
    this.ensurePath('spec.template.spec.domain.devices.disks', []);
    this.ensurePath('spec.template.spec.volumes', []);
    this.ensurePath('spec.dataVolumeTemplates', []);
  };

  private ensureNetworksConsistency = () => {
    this.clearIfEmpty('spec.template.spec.domain.devices.interfaces');
    this.clearIfEmpty('spec.template.spec.networks');
  };

  private ensureStorageConsistency = () => {
    this.clearIfEmpty('spec.template.spec.domain.devices.disks');
    this.clearIfEmpty('spec.template.spec.volumes');
    this.clearIfEmpty('spec.dataVolumeTemplates');
  };
}
