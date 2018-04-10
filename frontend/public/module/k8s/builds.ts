import * as _ from 'lodash-es';

import { BuildModel, BuildConfigModel } from '../../models';
import { k8sCreate } from './';
import { formatDuration } from '../../components/utils/datetime';

const createBuildRequest = (obj, model, subresource) => {
  const req = {
    kind: 'BuildRequest',
    apiVersion: 'build.openshift.io/v1',
    metadata: _.pick(obj.metadata, ['name', 'namespace']),
  };
  const opts = {
    name: obj.metadata.name,
    path: subresource,
  };
  return k8sCreate(model, req, opts);
};

export const startBuild = buildConfig => {
  return createBuildRequest(buildConfig, BuildConfigModel, 'instantiate');
};

export const cloneBuild = build => {
  return createBuildRequest(build, BuildModel, 'clone');
};

export const isFinished = build => !!_.get(build, 'status.completionTimestamp');

// Formats duration for finished builds.
export const formatBuildDuration = build => {
  if (!isFinished(build)) {
    return '';
  }

  const duration = _.get(build, 'status.duration');
  if (!_.isFinite(duration)) {
    return '';
  }

  // Duration in the build is returned as nanoseconds. Convert to milliseconds.
  const ms = Math.floor(duration / 1000 / 1000);
  return formatDuration(ms);
};
