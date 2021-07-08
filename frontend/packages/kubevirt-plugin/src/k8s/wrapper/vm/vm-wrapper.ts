/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { VMWizardNetwork, VMWizardStorage } from '../../../components/create-vm-wizard/types';
import {
  CLOUD_INIT_CONFIG_DRIVE,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
  VolumeType,
} from '../../../constants/vm';
import { VirtualMachineImportModel, VirtualMachineModel } from '../../../models';
import { getLabels } from '../../../selectors';
import { toDataVolumeTemplateSpec } from '../../../selectors/dv/selectors';
import { transformDevices } from '../../../selectors/vm/devices';
import {
  getAffinity,
  getCloudInitVolume,
  getDataVolumeTemplates,
  getDevices,
  getDisks,
  getInterfaces,
  getNetworks,
  getNodeSelector,
  getTolerations,
  getVolumes,
  isDedicatedCPUPlacement,
} from '../../../selectors/vm/selectors';
import {
  CPURaw,
  V1DataVolumeTemplateSpec,
  V1NetworkInterface,
  VMISpec,
  VMKind,
} from '../../../types';
import { V1alpha1DataVolume, V1Disk, V1Volume } from '../../../types/api';
import {
  findKeySuffixValue,
  buildOwnerReferenceForModel,
  compareOwnerReference,
} from '../../../utils';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { BootDevice, VMILikeMethods } from './types';
import { VolumeWrapper } from './volume-wrapper';

export class VMWrapper extends K8sResourceWrapper<VMKind, VMWrapper> implements VMILikeMethods {
  constructor(vm?: VMKind | VMWrapper | any, copy = false) {
    super(VirtualMachineModel, vm, copy);
  }

  hasTemplateLabel = (label: string) => _.has(this.getTemplateLabels(null), label);

  getOperatingSystem = () => findKeySuffixValue(this.getLabels(), TEMPLATE_OS_LABEL);
  getWorkloadProfile = () => findKeySuffixValue(this.getLabels(), TEMPLATE_WORKLOAD_LABEL);
  getFlavor = () => findKeySuffixValue(this.getLabels(), TEMPLATE_FLAVOR_LABEL);
  getVirtualMachineInstanceSpec = (): VMISpec => this.data?.spec?.template?.spec;
  getEvictionStrategy = (): string => this.getVirtualMachineInstanceSpec()?.evictionStrategy;
  getMemory = () => this.getVirtualMachineInstanceSpec()?.domain?.resources?.requests?.memory;
  getCPU = (): CPURaw => this.getVirtualMachineInstanceSpec()?.domain?.cpu;

  getTemplateLabels = (defaultValue = {}) =>
    getLabels(_.get(this.data, 'spec.template'), defaultValue);

  getDataVolumeTemplates = (defaultValue = []) => getDataVolumeTemplates(this.data, defaultValue);

  getDevices = (defaultValue = {}) => getDevices(this.data, defaultValue);

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

  getBootDisk = (): V1Disk => {
    const disks = this.getDisks();
    return disks.find((d) => d.bootOrder === 1) || disks[0];
  };

  getBootDevice = (): BootDevice => {
    const devices = this.getDevices();
    if (devices.disks) {
      const bootDisk = devices.disks.find((d) => d.bootOrder === 1);
      if (bootDisk) {
        return {
          device: bootDisk,
          type: 'disk',
        };
      }
    }

    if (devices.interfaces) {
      const bootInterface = devices.interfaces.find((i) => i.bootOrder === 1);
      if (bootInterface) {
        return {
          device: bootInterface,
          type: 'interface',
        };
      }
    }

    const devicesKeys = Object.keys(devices);
    const deviceIndex = _.toArray(devices).findIndex((d) => d.length > 0);

    if (deviceIndex !== -1) {
      const deviceKey = devicesKeys[deviceIndex];
      return {
        device: devices[deviceKey][0],
        type: deviceKey === 'disks' ? 'disk' : 'interface',
      };
    }
    return null;
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

  setStorage = (
    storages: {
      disk: V1Disk;
      volume: V1Volume;
      dataVolume?: V1alpha1DataVolume;
    }[],
  ) => {
    this.ensurePath('spec.template.spec.domain.devices');
    this.data.spec.template.spec.domain.devices.disks = _.compact(
      storages.map((storage) => storage.disk),
    );
    this.data.spec.template.spec.volumes = _.compact(storages.map((storage) => storage.volume));
    this.data.spec.dataVolumeTemplates = _.compact(storages.map((storage) => storage.dataVolume));
    this.ensureStorageConsistency();
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

  appendStorage = ({
    disk,
    volume,
    dataVolume,
  }: {
    disk?: V1Disk;
    volume?: V1Volume;
    dataVolume?: V1alpha1DataVolume;
  }) => {
    this.ensureStorages();
    disk && this.getDisks().push(disk);
    volume && this.getVolumes().push(volume);
    dataVolume && this.getDataVolumeTemplates().push(dataVolume);
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
        (dataVolume) => dataVolume.metadata.name !== volumeWrapper.getDataVolumeName(),
      );
    }

    this.ensureStorageConsistency();
    return this;
  };

  removeInterface = (interfaceName: string) => {
    this.ensurePath('spec.template.spec.domain.devices', {});
    this.data.spec.template.spec.domain.devices.interfaces = this.getNetworkInterfaces().filter(
      (i) => i.name !== interfaceName,
    );
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
      storages.map((storage) => (storage.disk?.name ? storage.disk : null)),
    );
    this.data.spec.template.spec.volumes = _.compact(storages.map((storage) => storage.volume));
    this.data.spec.dataVolumeTemplates = _.compact(
      storages.map((storage) => toDataVolumeTemplateSpec(storage.dataVolume)),
    );
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

  setSSHKey = (secretNames: string[]) => {
    this.ensurePath('spec.template.spec');
    const accessCredentialsKeys = secretNames.map((secretName) => ({
      sshPublicKey: {
        propagationMethod: { configDrive: { name: CLOUD_INIT_CONFIG_DRIVE } },
        source: { secret: { secretName } },
      },
    }));
    this.data.spec.template.spec.accessCredentials = accessCredentialsKeys;
  };

  ensureDataVolumeTemplates = (): V1DataVolumeTemplateSpec[] =>
    this.ensurePath('spec.dataVolumeTemplates', []);

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
