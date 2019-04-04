import { get } from 'lodash-es';

export const getHostSpec = bmo =>
  get(bmo, 'spec', {
    online: false,
  });

export const getHostStatus = bmo =>
  get(bmo, 'status', {
    hardware: {
      nics: [],
      storage: [],
    },
  });
