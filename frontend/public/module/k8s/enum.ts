/**
 * @deprecated: Use `modelFor`, `allModels`, or `connectToModel`
 * TODO(alecmerdler): Remove this and replace calls
 */

import * as _ from 'lodash';

import * as staticModels from '../../models';
// eslint-disable-next-line no-unused-vars
import { K8sKind } from './index';

export const k8sKinds = {};

_.each(staticModels, (model, name) => {
  k8sKinds[name.replace(/Model$/, '')] = model;
});

const starModel: K8sKind = {
  id: 'all',
  plural: 'all',
  labelPlural: 'All',
  abbr: '*',
  kind: '*',
  label: '*',
  path: '*',
};

k8sKinds['*'] = starModel;
