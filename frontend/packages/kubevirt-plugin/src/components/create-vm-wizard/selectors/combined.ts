import { Map as ImmutableMap } from 'immutable';
import { ITemplate } from '../../../types/template';
import { getTemplateOperatingSystems } from '../../../selectors/vm-template/advanced';
import { concatImmutableLists, immutableListToShallowJS } from '../../../utils/immutable';
import { TemplateKind } from '@console/internal/module/k8s';
import { operatingSystemsNative } from '../native/consts';

export const getOS = ({ osID, iUserTemplates, openshiftFlag, iCommonTemplates }: GetOSParams) => {
  const operatingSystems = openshiftFlag
    ? getTemplateOperatingSystems(
        immutableListToShallowJS<TemplateKind>(
          concatImmutableLists(iUserTemplates, iCommonTemplates),
        ),
      )
    : operatingSystemsNative;

  return {
    osID,
    osName: (operatingSystems.find(({ id }) => id === osID) || {}).name,
  };
};

type GetOSParams = {
  osID: string;
  iUserTemplates: ImmutableMap<string, ITemplate>;
  iCommonTemplates: ImmutableMap<string, ITemplate>;
  openshiftFlag: boolean;
};
