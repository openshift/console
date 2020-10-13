import * as _ from 'lodash';
import { OperatingSystem, Workload, OSIDLookup } from '../utils/constants/wizard';
import { FlavorConfig, Disk, Network, CloudInitConfig } from '../types/types';
import { BaseVMBuilderData } from '../types/vm';
import { K8sKind } from '@console/internal/module/k8s';
import { getRandStr } from '../utils/utils';
import { ProvisionSource } from '../utils/constants/enums/provisionSource';

export abstract class BaseVMBuilder<T extends BaseVMBuilderData> {
  protected model: K8sKind;

  protected data: T;

  constructor(model: K8sKind, builder?: BaseVMBuilder<T>) {
    this.model = model;
    this.data = builder ? builder.getData() : ({ networks: [], disks: [] } as any);
  }

  public getOSID() {
    return OSIDLookup[this.data.os];
  }

  public generateName(id?: string) {
    this.data.name = [
      id || '',
      this.model.abbr.toLowerCase(),
      this.data.namespace,
      this.data.workload,
      this.data.flavor?.flavor,
      this.getOSID(),
      getRandStr(5),
    ]
      .filter((a) => a)
      .map((a) => a.toLowerCase().replace(/[^-a-zA-Z0-9]/g, ''))
      .join('-');
    return this;
  }

  public generateNameForPrefix(prefix: string) {
    this.data.name = `${prefix}-${getRandStr(5)}`;
    return this;
  }

  public setName(name: string) {
    this.data.name = name;
    return this;
  }

  public setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  public setNamespace(namespace: string) {
    this.data.namespace = namespace;
    return this;
  }

  public setTemplate(template: string) {
    this.data.template = template;
    return this;
  }

  public setFlavor(flavor: FlavorConfig) {
    this.data.flavor = flavor;
    return this;
  }

  public setWorkload(workload: Workload) {
    this.data.workload = workload;
    return this;
  }

  public setOS(os: OperatingSystem) {
    this.data.os = os;
    return this;
  }

  public setProvisionSource(provisionSource: ProvisionSource) {
    this.data.provisionSource = provisionSource;
    return this;
  }

  public setNetworks(networks: Network[]) {
    this.data.networks = networks;
    return this;
  }

  public setDisks(disks: Disk[]) {
    this.data.disks = disks;
    return this;
  }

  public setCloudInit(cloudInit: CloudInitConfig) {
    this.data.cloudInit = cloudInit;
    return this;
  }

  /**
   * Sets attributes configured in passed builder instance.
   * @param builder BaseVMBuilder<T>
   */
  public setBuilderAttributes(builder: BaseVMBuilder<T>) {
    const data = builder.getData();
    Object.keys(data)
      .filter((key) => data[key] !== undefined)
      .forEach((key) => {
        this.data[key] = data[key];
      });
    return this;
  }

  public appendBuilder(builder: BaseVMBuilder<T>) {
    const customAppendKeys = new Set(['networks', 'disks']);
    const data = builder.getData();
    Object.keys(data)
      .filter((key) => !customAppendKeys.has(key) && data[key] !== undefined)
      .forEach((key) => {
        this.data[key] = data[key];
      });

    if (data.networks) {
      const networks = new Set(data.networks);
      this.data.networks.forEach((network) => {
        networks.add(network);
      });
      this.data.networks = [...networks];
    }

    if (data.disks) {
      const disks = new Set(data.disks);
      this.data.disks.forEach((disk) => {
        disks.add(disk);
      });
      this.data.disks = [...disks];
    }
  }

  public setData(data: T) {
    this.data = data;
    return this;
  }

  public getData(): T {
    return _.cloneDeep(this.data);
  }
}
