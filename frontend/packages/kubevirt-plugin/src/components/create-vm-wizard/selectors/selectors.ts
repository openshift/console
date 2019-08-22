import { get } from 'lodash';
import { Map } from 'immutable';

export const getCreateVMWizards = (state): Map<string, any> =>
  get(state, ['kubevirt', 'createVmWizards']);
