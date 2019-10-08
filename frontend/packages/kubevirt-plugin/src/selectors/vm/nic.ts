import * as _ from 'lodash';

export const getNicBus = (nic, defaultValue?): string => _.get(nic, 'model', defaultValue);
