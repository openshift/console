import { Map as ImmutableMap, Map } from 'immutable';
import * as _ from 'lodash';
import { getTemplateOperatingSystems } from '../../../selectors/vm-template/advanced';
import { concatImmutableLists, immutableListToShallowJS } from '../../../utils/immutable';
import { TemplateKind } from '@console/internal/module/k8s';
import { operatingSystemsNative } from '../native/consts';
import { ITemplate } from '../../../types/template';

export const getCreateVMWizards = (state): Map<string, any> =>
  _.get(state, ['plugins', 'kubevirt', 'createVmWizards']);

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
