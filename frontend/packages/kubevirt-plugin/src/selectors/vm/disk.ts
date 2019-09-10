import * as _ from 'lodash';

export const getDiskBus = (disk, defaultValue?): string => _.get(disk, 'disk.bus', defaultValue);
