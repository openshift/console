import { k8sList, k8sPatch, K8sResourceKind, modelFor } from '@console/internal/module/k8s';
import * as _ from 'lodash';

const updateItemAppLabel = (item: K8sResourceKind, application) => {
  const labels = _.cloneDeep(item.metadata.labels || {});
  const model = modelFor(item.kind);

  if (!model) {
    return Promise.reject();
  }

  if (application) {
    labels['app.kubernetes.io/part-of'] = application;
  } else {
    labels['app.kubernetes.io/part-of'] = undefined;
  }

  const patch = [
    {
      op: _.isEmpty(labels) ? 'add' : 'replace',
      path: '/metadata/labels',
      value: labels,
    },
  ];

  return k8sPatch(model, item, patch);
};

export const updateResourceApplication = (
  resource: K8sResourceKind,
  application: string,
): Promise<any> => {
  if (!resource) {
    return Promise.reject();
  }

  const instanceName = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/instance']);
  const prevApplication = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/part-of']);

  const lists: Promise<any>[] = [];
  const patches: Promise<any>[] = [updateItemAppLabel(resource, application)];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // Retrieve all resources with the same instance label
  const kinds = ['ReplicationController', 'Route', 'Service', 'ReplicaSet', 'BuildConfig', 'Build'];
  _.forEach(kinds, (kind) => {
    lists.push(
      k8sList(modelFor(kind), {
        ns: resource.metadata.namespace,
        labelSelector: { 'app.kubernetes.io/instance': instanceName },
      }).then((values) => {
        return _.map(values, (value) => {
          value.kind = kind;
          return value;
        });
      }),
    );
  });

  // Update all the instance's resources that were part of the previous application
  return Promise.all(lists).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        const itemApplication = _.get(item, ['metadata', 'labels', 'app.kubernetes.io/part-of']);
        if (itemApplication === prevApplication) {
          patches.push(updateItemAppLabel(item, application));
        }
      });
    });

    return Promise.all(patches);
  });
};
