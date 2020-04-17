import { Map } from 'immutable';
import * as _ from 'lodash';

// ATTENTION: please do not add any new imports here
//   - it can easily cause cyclic dependencies (especially in this directory)

export const getCreateVMWizards = (state): Map<string, any> =>
  _.get(state, ['plugins', 'kubevirt', 'createVmWizards']);
