import {util} from './util';

export const clean = service => {
  util.nullifyEmpty(service.metadata, ['annotations', 'labels']);
  util.nullifyEmpty(service.spec, ['ports']);
  util.deleteNulls(service.metadata);
  util.deleteNulls(service.spec);
};
