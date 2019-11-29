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

export class VMWrapper extends Wrapper<VMKind> {
  static readonly EMPTY = new VMWrapper();

  static mergeWrappers = (...vmWrappers: VMWrapper[]): VMWrapper =>
    Wrapper.defaultMergeWrappers(VMWrapper, vmWrappers);

  static initialize = (persistentVolumeClaim?: VMKind, copy?: boolean) =>
    new VMWrapper(persistentVolumeClaim, copy && { copy });

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
  public constructor(volume?: VMKind, opts?: { copy?: boolean }) {
    super(volume, opts);
  }

  ensureMetadata = () => this.ensurePath('metadata', {});
  ensureSpec = () => this.ensurePath('spec', {});
  ensureDomain = () => this.ensurePath('spec.template.spec.domain', {});

  ensureLabels = () => this.ensurePath('metadata.labels', {});
  ensureAnnotations = () => this.ensurePath('metadata.annotations', {});
  ensureTemplateLabels = () => this.ensurePath('spec.template.metadata.labels', {});

  ensureDataVolumeTemplates = () => this.ensurePath('spec.dataVolumeTemplates', []);
  ensureInterfaces = () => this.ensurePath('spec.template.spec.domain.devices.interfaces', []);
  ensureDisks = () => this.ensurePath('spec.template.spec.domain.devices.disks', []);
  ensureNetworks = () => this.ensurePath('spec.template.spec.networks', []);
  ensureVolumes = () => this.ensurePath('spec.template.spec.volumes', []);

  asMutableResource = () => this.data;

  ensurePath = (path: string[] | string, value) => {
    let currentFragment: any = this.data;
    if (path) {
      const arrPath = _.isString(path) ? path.split('.') : path;

      arrPath.forEach((pathElement, idx) => {
        const isLast = idx === arrPath.length - 1;

        const nextFragment = currentFragment[pathElement];

        if (isLast ? nextFragment != null : _.isObject(nextFragment)) {
          currentFragment = nextFragment;
        } else {
          const newFragment = isLast ? value : {};
          currentFragment[pathElement] = newFragment;
          currentFragment = newFragment;
        }
      });
    }

    return currentFragment;
  };
}
