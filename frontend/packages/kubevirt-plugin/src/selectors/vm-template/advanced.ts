import * as _ from 'lodash';
import { convertToBaseValue, humanizeBinaryBytes } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { getLabel, getName } from '@console/shared';
import { BootSourceState } from '../../components/create-vm/forms/boot-source-form-reducer';
import { stringValueUnitSplit } from '../../components/form/size-unit-utils';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../constants';
import {
  DataVolumeSourceType,
  DEFAULT_DISK_SIZE,
  DiskBus,
  LABEL_CDROM_SOURCE,
  OS_WINDOWS_PREFIX,
  ROOT_DISK_NAME,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  TEMPLATE_VERSION_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../k8s/wrapper/vm/cloud-init-data-helper';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { isTemplateSourceError, TemplateSourceStatus } from '../../statuses/template/types';
import { compareVersions, removeOSDups } from '../../utils/sort';
import { getDataVolumeStorageSize } from '../dv/selectors';
import { getAnnotation, getAnnotations, getLabels, getParameterValue } from '../selectors';
import { getFlavorData } from '../vm/flavor-data';
import {
  getCloudInitVolume,
  getCPU,
  getDataVolumeTemplates,
  getFlavor,
  getMemory,
} from '../vm/selectors';
import { isCommonTemplate, selectVM } from './basic';

export const getTemplatesWithLabels = (templates: TemplateKind[], labels: string[]) => {
  const requiredLabels = labels.filter((label) => label);
  return templates.filter((template) => {
    const templateLabels = new Set(Object.keys(getLabels(template, {})));
    const missingLabel = requiredLabels.find((requiredLabel) => !templateLabels.has(requiredLabel));
    return !missingLabel;
  });
};

export const getTemplatesOfLabelType = (templates: TemplateKind[], type: string) =>
  (templates || []).filter(
    (template) => _.get(template, ['metadata', 'labels', TEMPLATE_TYPE_LABEL]) === type,
  );

export const getUserTemplate = (templates: TemplateKind[], userTemplateName: string) => {
  const userTemplates = getTemplatesOfLabelType(templates, TEMPLATE_TYPE_VM);
  return userTemplates.find((template) => template.metadata.name === userTemplateName);
};

export const getTemplatesLabelValues = (templates: TemplateKind[], label: string): string[] => {
  const labelValues = [];
  (templates || []).forEach((template) => {
    const labels = Object.keys(getLabels(template, {})).filter((l) => l.startsWith(label));
    labels.forEach((l) => {
      const labelParts = l.split('/');
      if (labelParts.length > 1) {
        const labelName = labelParts[labelParts.length - 1];
        if (labelValues.indexOf(labelName) === -1) {
          labelValues.push(labelName);
        }
      }
    });
  });
  return labelValues;
};

export const getTemplateFlavors = (templates: TemplateKind[]) =>
  getTemplatesLabelValues(templates, TEMPLATE_FLAVOR_LABEL);

export const getTemplateHostname = (template: TemplateKind) => {
  const vm = selectVM(template);
  const YAMLHostname = _.get(vm, 'spec.template.spec') && vm.spec.template.spec.hostname;
  if (YAMLHostname) {
    return YAMLHostname;
  }

  const cloudInitVolume = getCloudInitVolume(vm);
  const data = new VolumeWrapper(cloudInitVolume).getCloudInitNoCloud();
  const cloudInitHelper = new CloudInitDataHelper(data);
  return cloudInitHelper.get(CloudInitDataFormKeys.HOSTNAME);
};

export const getTemplateOperatingSystems = (templates: TemplateKind[]) => {
  const osIds = getTemplatesLabelValues(templates, TEMPLATE_OS_LABEL);
  const sortedTemplates = [...templates].sort((a, b) => {
    const aVersion = getLabel(a, TEMPLATE_VERSION_LABEL);
    const bVersion = getLabel(b, TEMPLATE_VERSION_LABEL);

    return -1 * compareVersions(aVersion, bVersion);
  });

  return removeOSDups(
    osIds.map((osId) => {
      const nameAnnotation = `${TEMPLATE_OS_NAME_ANNOTATION}/${osId}`;
      const template = sortedTemplates.find(
        (t) =>
          !!Object.keys(getAnnotations(t, {})).find((annotation) => annotation === nameAnnotation),
      );
      const vm = selectVM(template);
      const dvTemplates = getDataVolumeTemplates(vm);
      const dv = dvTemplates.find((dvt) => getName(dvt) === VM_TEMPLATE_NAME_PARAMETER);

      return {
        id: osId,
        name: getAnnotation(template, nameAnnotation),
        baseImageName: getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER),
        baseImageNamespace: getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER),
        baseImageRecomendedSize: dv && stringValueUnitSplit(getDataVolumeStorageSize(dv)),
      };
    }),
  );
};

export const getTemplateWorkloadProfiles = (templates: TemplateKind[]) =>
  getTemplatesLabelValues(templates, TEMPLATE_WORKLOAD_LABEL);

export const isWindowsTemplate = (template: TemplateKind): boolean =>
  getTemplateOperatingSystems([template])?.some((os) => os.id.startsWith(OS_WINDOWS_PREFIX));

export const getTemplateSizeRequirementInBytes = (
  template: TemplateKind,
  templateSource: TemplateSourceStatus,
  customSource?: BootSourceState,
): string => {
  const vm = selectVM(template);
  const dvTemplates = getDataVolumeTemplates(vm);
  const templatesSize = dvTemplates.reduce((acc, dvt) => {
    const size = getDataVolumeStorageSize(dvt);
    if (size) {
      return acc;
    }
    return acc + convertToBaseValue(size);
  }, 0);
  let sourceSize = 0;
  let isCDRom = false;
  if (customSource?.dataSource) {
    sourceSize =
      customSource.dataSource?.value === DataVolumeSourceType.PVC.getValue()
        ? convertToBaseValue(customSource.pvcSize?.value)
        : convertToBaseValue(`${customSource.size?.value.value}${customSource.size?.value.unit}`);
    isCDRom = customSource.cdRom?.value;
  } else if (!isTemplateSourceError(templateSource) && templateSource?.pvc) {
    sourceSize = convertToBaseValue(templateSource.pvc.spec.resources.requests.storage);
    isCDRom =
      isCommonTemplate(template) &&
      (templateSource.dataVolume || templateSource.pvc)?.metadata.labels?.[LABEL_CDROM_SOURCE] ===
        'true';
  } else if (!isTemplateSourceError(templateSource) && templateSource?.dvTemplate) {
    sourceSize = convertToBaseValue(getDataVolumeStorageSize(templateSource.dvTemplate));
  }

  return templatesSize + sourceSize + (isCDRom ? convertToBaseValue(DEFAULT_DISK_SIZE) : 0);
};

export const getTemplateMemory = (template: TemplateKind): string => {
  const baseMemoryValue = convertToBaseValue(getMemory(selectVM(template)));
  return humanizeBinaryBytes(baseMemoryValue).string;
};

export const getTemplateFlavorData = (template: TemplateKind) => {
  return getFlavorData({
    cpu: getCPU(selectVM(template)),
    memory: getMemory(selectVM(template)),
    flavor: getFlavor(template),
  });
};

export const getDefaultDiskBus = (template: TemplateKind): DiskBus => {
  const vmWrapper = new VMWrapper(template);
  const rootDisk = vmWrapper.getDisks().find((d) => d.name === ROOT_DISK_NAME);
  if (rootDisk) {
    return DiskBus.VIRTIO;
  }
  return new DiskWrapper(rootDisk).getDiskBus() || DiskBus.VIRTIO;
};
