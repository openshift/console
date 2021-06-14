import { List as ImmutableList, Map as ImmutableMap } from 'immutable';
import {
  TEMPLATE_DEFAULT_LABEL,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_VERSION_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../constants/vm';
import { Flavor } from '../../../constants/vm/flavor';
import { WorkloadProfile } from '../../../constants/vm/workload-profile';
import { VirtualMachineModel } from '../../../models';
import { ITemplate } from '../../../types/template';
import { iGet, iGetIn } from '../../../utils/immutable';
import { compareVersions } from '../../../utils/sort';
import { getFlavorLabel, getOsLabel, getWorkloadLabel } from '../../vm-template/combined-dependent';
import { isWinToolsImage } from '../../vm/winimage';
import { iGetCreationTimestamp, iGetLabels } from '../common';

type FindTemplateOptions = {
  workload?: string;
  flavor?: string;
  os?: string;
};

const flavorOrder = {
  large: 0,
  medium: 1,
  small: 2,
  tiny: 3,
  unknown: 4,
};

export const iGetRelevantTemplates = (
  iCommonTemplates: ImmutableMap<string, ITemplate>,
  { workload, flavor, os }: FindTemplateOptions,
): ImmutableList<ITemplate> => {
  const osLabel = getOsLabel(os);
  const workloadLabel = getWorkloadLabel(workload);
  const flavorLabel = getFlavorLabel(flavor);

  return ImmutableList<ITemplate>(
    (iCommonTemplates || ImmutableMap())
      .valueSeq()
      .filter((iTemplate) => {
        const labels = iGetLabels(iTemplate);

        return (
          labels &&
          labels.get(TEMPLATE_TYPE_LABEL) === TEMPLATE_TYPE_BASE &&
          (!osLabel || labels.has(osLabel)) &&
          (!workloadLabel || labels.has(workloadLabel)) &&
          (!flavorLabel || labels.has(flavorLabel))
        );
      })
      .sort((a, b) => {
        const aLabels = iGetLabels(a);
        const bLabels = iGetLabels(b);

        let aFlavor =
          aLabels &&
          flavorOrder[Object.keys(flavorOrder).find((f) => aLabels.has(getFlavorLabel(f)))];
        let bFlavor =
          bLabels &&
          flavorOrder[Object.keys(flavorOrder).find((f) => bLabels.has(getFlavorLabel(f)))];

        if (aFlavor == null) {
          aFlavor = flavorOrder.unknown;
        }

        if (bFlavor == null) {
          bFlavor = flavorOrder.unknown;
        }

        const flavorCMP = aFlavor - bFlavor;

        if (flavorCMP !== 0) {
          return flavorCMP;
        }

        const aVersion = aLabels?.get(TEMPLATE_VERSION_LABEL);
        const bVersion = bLabels?.get(TEMPLATE_VERSION_LABEL);

        const versionCMP = compareVersions(aVersion, bVersion) * -1; // descending

        if (versionCMP !== 0) {
          return versionCMP;
        }

        return new Date(iGetCreationTimestamp(a)) > new Date(iGetCreationTimestamp(b)) ? -1 : 1;
      }),
  );
};

export const iGetRelevantTemplate = (
  ...args: Parameters<typeof iGetRelevantTemplates>
): ITemplate => iGetRelevantTemplates(...args).first();

export const iSelectVM = (tmp: ITemplate) =>
  iGetIn(tmp, ['objects'])?.find((obj) => iGet(obj, 'kind') === VirtualMachineModel.kind);

export const iGetCommonTemplateCloudInit = (tmp: ITemplate) => {
  const iCloudInitStorage = iGetIn(iSelectVM(tmp), ['spec', 'template', 'spec', 'volumes'])?.find(
    (storage) => !!iGet(storage, 'cloudInitNoCloud'),
  );
  return iGet(iCloudInitStorage, 'cloudInitNoCloud');
};

export const iGetCommonTemplateDiskBus = (tmp: ITemplate, diskName: string) => {
  const disk = iGetIn(iSelectVM(tmp), [
    'spec',
    'template',
    'spec',
    'domain',
    'devices',
    'disks',
  ])?.find((d) => iGetIn(d, ['name']) === diskName);

  return iGetIn(disk, ['disk', 'bus']);
};

export const iGetDefaultTemplate = (
  iCommonTemplates: ImmutableMap<string, ITemplate>,
  os: string,
): ITemplate =>
  (iCommonTemplates || ImmutableMap()).valueSeq().find((iTemplate) => {
    const labels = iGetLabels(iTemplate);
    return labels && labels.get(getOsLabel(os)) && labels.get(TEMPLATE_DEFAULT_LABEL) === 'true';
  });

export const getITemplateDefaultFlavor = (template: ITemplate): Flavor =>
  template &&
  Flavor.getAll().find(
    (f) => iGetLabels(template).get(`${TEMPLATE_FLAVOR_LABEL}/${f.getValue()}`) === 'true',
  );

export const getITemplateDefaultWorkload = (template: ITemplate): WorkloadProfile =>
  template &&
  WorkloadProfile.getAll().find(
    (w) => iGetLabels(template).get(`${TEMPLATE_WORKLOAD_LABEL}/${w.getValue()}`) === 'true',
  );

export const iGetTemplateGuestToolsDisk = (tmp: ITemplate) =>
  iGetIn(iSelectVM(tmp), ['spec', 'template', 'spec', 'volumes'])?.find((v) =>
    isWinToolsImage(iGetIn(v, ['containerDisk', 'image'])),
  );
