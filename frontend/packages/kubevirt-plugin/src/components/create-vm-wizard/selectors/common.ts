import { Map } from 'immutable';
import * as _ from 'lodash';

export const getCreateVMWizards = (state): Map<string, any> =>
  _.get(state, ['plugins', 'kubevirt', 'createVmWizards']);
