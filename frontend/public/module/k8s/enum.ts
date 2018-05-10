import * as _ from 'lodash-es';

import * as staticModels from '../../models';
// eslint-disable-next-line no-unused-vars
import { K8sKind } from './index';

/**
 * @deprecated: Use `modelFor`, `allModels`, or `connectToModel`
 * TODO: Remove this and replace calls
 */
export const k8sKinds = {};

_.each(staticModels, (model, name) => {
  k8sKinds[name.replace(/Model$/, '')] = model;
});

const starModel: K8sKind = {
  apiVersion: 'v1',
  id: 'all',
  plural: 'all',
  labelPlural: 'All',
  abbr: '*',
  kind: '*',
  label: '*',
  path: '*',
};

k8sKinds['*'] = starModel;
