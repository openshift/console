import { List as ImmutableList, Map as ImmutableMap } from 'immutable';
import { getFlavorLabel, getOsLabel, getWorkloadLabel } from '../../vm-template/combined-dependent';
import { TEMPLATE_TYPE_BASE, TEMPLATE_TYPE_LABEL } from '../../../constants/vm';
import { iGetName } from '../../../components/create-vm-wizard/selectors/immutable/selectors';
import { ITemplate } from '../../../types/template';
import { iGetLabels } from '../common';

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

        const aFlavor =
          aLabels &&
          flavorOrder[Object.keys(flavorOrder).find((f) => aLabels.has(getFlavorLabel(f)))];
        const bFlavor =
          bLabels &&
          flavorOrder[Object.keys(flavorOrder).find((f) => bLabels.has(getFlavorLabel(f)))];

        if (aFlavor == null) {
          return -1;
        }

        if (bFlavor == null) {
          return 1;
        }

        return aFlavor - bFlavor;
      }),
  );
};

export const iGetRelevantTemplate = (
  ...args: Parameters<typeof iGetRelevantTemplates>
): ITemplate => iGetRelevantTemplates(...args).first();
