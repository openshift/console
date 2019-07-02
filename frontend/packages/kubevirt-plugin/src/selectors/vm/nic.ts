import * as _ from 'lodash';

export const getNicBootOrder = (nic, defaultValue?): number =>
  _.get(nic, 'bootOrder', defaultValue);

export const getNicBus = (nic, defaultValue?): string => _.get(nic, 'model', defaultValue);
