import * as _ from 'lodash';

export const getDiskBus = (disk, defaultValue?): string => _.get(disk, 'disk.bus', defaultValue);

export const getDiskBootOrder = (disk, defaultValue?): number =>
  _.get(disk, 'bootOrder', defaultValue);
