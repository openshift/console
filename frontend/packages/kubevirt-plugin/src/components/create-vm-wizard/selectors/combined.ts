import { Map as ImmutableMap } from 'immutable';
import { TemplateKind } from '@console/internal/module/k8s';
import { ITemplate } from '../../../types/template';
import { getTemplateOperatingSystems } from '../../../selectors/vm-template/advanced';
import { immutableListToShallowJS, toShallowJS } from '../../../utils/immutable';
import { operatingSystemsNative } from '../../../constants/vm-templates/os';

export const getOS = ({ osID, iUserTemplate, openshiftFlag, iCommonTemplates }: GetOSParams) => {
  let operatingSystems = [];

  if (openshiftFlag && iUserTemplate) {
    operatingSystems = getTemplateOperatingSystems([toShallowJS(iUserTemplate)]);
  } else {
    operatingSystems = openshiftFlag
      ? getTemplateOperatingSystems(immutableListToShallowJS<TemplateKind>(iCommonTemplates))
      : operatingSystemsNative;
  }

  return {
    osID,
    osName: (operatingSystems.find(({ id }) => id === osID) || {})?.name,
  };
};

type GetOSParams = {
  osID: string;
  iUserTemplate: ITemplate;
  iCommonTemplates: ImmutableMap<string, ITemplate>;
  openshiftFlag: boolean;
};
