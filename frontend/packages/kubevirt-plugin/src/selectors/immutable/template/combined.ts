import { List as ImmutableList, Map as ImmutableMap } from 'immutable';
import { getFlavorLabel, getOsLabel, getWorkloadLabel } from '../../vm-template/combined-dependent';
import {
  TEMPLATE_VERSION_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
} from '../../../constants/vm';
import { iGetName } from '../../../components/create-vm-wizard/selectors/immutable/selectors';
import { ITemplate } from '../../../types/template';
import { iGetCreationTimestamp, iGetLabels } from '../common';
import { compareVersions, splitVersion } from '../../../utils/sort';

type FindTemplateOptions = {
  userTemplateName?: string;
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
  iUserTemplates: ImmutableMap<string, ITemplate>,
  iCommonTemplates: ImmutableMap<string, ITemplate>,
  { userTemplateName, workload, flavor, os }: FindTemplateOptions,
): ImmutableList<ITemplate> => {
  if (userTemplateName && iUserTemplates) {
    const relevantTemplate = iUserTemplates.find(
      (template) => iGetName(template) === userTemplateName,
    );
    return ImmutableList.of(relevantTemplate);
  }

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

        const versionCMP = compareVersions(splitVersion(aVersion), splitVersion(bVersion)) * -1; // descending

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

export const iGetOSTemplates = (
  iCommonTemplates: ImmutableMap<string, ITemplate>,
  os: string,
): ImmutableList<ITemplate> => {
  const osLabel = getOsLabel(os);

  return ImmutableList<ITemplate>(
    (iCommonTemplates || ImmutableMap())
      .valueSeq()
      .filter((iTemplate) => iGetLabels(iTemplate)?.has(osLabel))
      .sort((a, b) => {
        const aLabels = iGetLabels(a);
        const bLabels = iGetLabels(b);

        const aVersion = aLabels?.get(TEMPLATE_VERSION_LABEL);
        const bVersion = bLabels?.get(TEMPLATE_VERSION_LABEL);

        const versionCMP = compareVersions(splitVersion(aVersion), splitVersion(bVersion)) * -1; // descending

        if (versionCMP !== 0) {
          return versionCMP;
        }

        return new Date(iGetCreationTimestamp(a)) > new Date(iGetCreationTimestamp(b)) ? -1 : 1;
      }),
  );
};

export const iGetOSTemplate = (...args: Parameters<typeof iGetOSTemplates>): ITemplate =>
  iGetOSTemplates(...args).first();
