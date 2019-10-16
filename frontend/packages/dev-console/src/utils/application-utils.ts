import * as _ from 'lodash';
import {
  K8sKind,
  k8sList,
  k8sPatch,
  k8sKill,
  K8sResourceKind,
  modelFor,
} from '@console/internal/module/k8s';
import {
  ImageStreamModel,
  BuildConfigModel,
  ServiceModel,
  DeploymentConfigModel,
  DeploymentModel,
  RouteModel,
  SecretModel,
  DaemonSetModel,
  StatefulSetModel,
} from '@console/internal/models';
import {
  RevisionModel,
  ConfigurationModel,
  ServiceModel as KnativeServiceModel,
  RouteModel as KnativeRouteModel,
} from '@console/knative-plugin';
import { checkAccess } from '@console/internal/components/utils';
import { TopologyDataObject } from '../components/topology/topology-types';
import { detectGitType } from '../components/import/import-validation-utils';
import { GitTypes } from '../components/import/import-types';

export const edgesFromAnnotations = (annotations): string[] => {
  let edges: string[] = [];
  if (_.has(annotations, ['app.openshift.io/connects-to'])) {
    try {
      edges = JSON.parse(annotations['app.openshift.io/connects-to']);
    } catch (e) {
      // connects-to annotation should hold a JSON string value but failed to parse
      // treat value as a comma separated list of strings
      edges = annotations['app.openshift.io/connects-to'].split(',').map((v) => v.trim());
    }
  }

  return edges;
};

const listInstanceResources = (
  namespace: string,
  instanceName: string,
  labelSelector: any = {},
): Promise<any> => {
  const lists: Promise<any>[] = [];
  const instanceLabelSelector = {
    'app.kubernetes.io/instance': instanceName,
    ...labelSelector,
  };

  const kinds = ['ReplicationController', 'Route', 'Service', 'ReplicaSet', 'BuildConfig', 'Build'];
  _.forEach(kinds, (kind) => {
    lists.push(
      k8sList(modelFor(kind), {
        ns: namespace,
        labelSelector: instanceLabelSelector,
      }).then((values) => {
        return _.map(values, (value) => {
          value.kind = kind;
          return value;
        });
      }),
    );
  });

  return Promise.all(lists);
};

// Updates the resource's labels to set its application grouping
const updateItemAppLabel = (
  resourceKind: K8sKind,
  item: K8sResourceKind,
  application: string,
): Promise<any> => {
  const labels = { ...item.metadata.labels, 'app.kubernetes.io/part-of': application || undefined };

  if (!resourceKind) {
    return Promise.reject();
  }

  const patch = [
    {
      op: _.isEmpty(labels) ? 'add' : 'replace',
      path: '/metadata/labels',
      value: labels,
    },
  ];

  return k8sPatch(resourceKind, item, patch);
};

// Updates the given resource and its associated resources to the given application grouping
export const updateResourceApplication = (
  resourceKind: K8sKind,
  resource: K8sResourceKind,
  application: string,
): Promise<any> => {
  if (!resource) {
    return Promise.reject();
  }

  const instanceName = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/instance']);
  const prevApplication = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/part-of']);

  const patches: Promise<any>[] = [updateItemAppLabel(resourceKind, resource, application)];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // selector is for the instance name and current application if there is one
  const labelSelector = {
    'app.kubernetes.io/instance': instanceName,
  };
  if (prevApplication) {
    labelSelector['app.kubernetes.io/part-of'] = prevApplication;
  }

  // Update all the instance's resources that were part of the previous application
  return listInstanceResources(resource.metadata.namespace, instanceName, {
    'app.kubernetes.io/part-of': prevApplication,
  }).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        // verify the case of no previous application
        if (prevApplication || !_.get(item, ['metadata', 'labels', 'app.kubernetes.io/part-of'])) {
          patches.push(updateItemAppLabel(modelFor(item.kind), item, application));
        }
      });
    });

    return Promise.all(patches);
  });
};

// Updates the item to add an new connect's to value replacing an old value if provided
const updateItemAppConnectTo = (
  item: K8sResourceKind,
  connectValue: string,
  oldValue: string = undefined,
) => {
  const model = modelFor(item.kind);

  if (!model) {
    return Promise.reject();
  }

  const tags = _.toPairs(item.metadata.annotations);
  let op = _.size(tags) ? 'replace' : 'add';

  const existingTag = _.find(tags, (tag) => tag[0] === 'app.openshift.io/connects-to');
  if (existingTag) {
    const connections = edgesFromAnnotations(item.metadata.annotations);
    if (connections.includes(connectValue)) {
      return Promise.resolve();
    }

    const index = connections.indexOf(oldValue);
    if (!connectValue) {
      _.remove(connections, (connection) => connection === oldValue);
    } else if (index >= 0) {
      connections[index] = connectValue;
    } else {
      connections.push(connectValue);
    }
    existingTag[1] = connections.join(',');

    if (!existingTag[1]) {
      _.remove(tags, (tag) => tag === existingTag);
      if (!_.size(tags)) {
        op = 'remove';
      }
    }
  } else {
    if (!connectValue) {
      // Removed connection not found, no need to remove
      return Promise.resolve();
    }

    const connectionTag: [string, string] = ['app.openshift.io/connects-to', connectValue];
    tags.push(connectionTag);
  }

  const patch = [{ path: '/metadata/annotations', op, value: _.fromPairs(tags) }];

  return k8sPatch(model, item, patch);
};

// Create a connection from the source to the target replacing the connection to replacedTarget if provided
export const createResourceConnection = (
  source: K8sResourceKind,
  target: K8sResourceKind,
  replacedTarget: K8sResourceKind = null,
): Promise<any> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const connectValue =
    _.get(target, ['metadata', 'labels', 'app.kubernetes.io/instance']) || target.metadata.name;

  const replaceValue =
    replacedTarget &&
    _.get(
      replacedTarget.metadata,
      ['labels', 'app.kubernetes.io/instance'],
      replacedTarget.metadata.name,
    );
  const instanceName = _.get(source, ['metadata', 'labels', 'app.kubernetes.io/instance']);

  const patches: Promise<any>[] = [updateItemAppConnectTo(source, connectValue, replaceValue)];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // Update all the instance's resources that were part of the previous application
  return listInstanceResources(source.metadata.namespace, instanceName).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        patches.push(updateItemAppConnectTo(item, connectValue, replaceValue));
      });
    });

    return Promise.all(patches);
  });
};

// Remove the connection from the source to the target
export const removeResourceConnection = (
  source: K8sResourceKind,
  target: K8sResourceKind,
): Promise<any> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const replaceValue =
    _.get(target, ['metadata', 'labels', 'app.kubernetes.io/instance']) || target.metadata.name;

  const instanceName = _.get(source, ['metadata', 'labels', 'app.kubernetes.io/instance']);

  const patches: Promise<any>[] = [updateItemAppConnectTo(source, '', replaceValue)];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // Update all the instance's resources that were part of the previous application
  return listInstanceResources(source.metadata.namespace, instanceName).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        patches.push(updateItemAppConnectTo(item, '', replaceValue));
      });
    });

    return Promise.all(patches);
  });
};

export const cleanUpWorkload = (
  resource: K8sResourceKind,
  workload: TopologyDataObject,
): Promise<K8sResourceKind[]> => {
  const reqs = [];
  const webhooks = [];
  let webhooksAvailable = true;
  const deleteModels = [BuildConfigModel, DeploymentConfigModel, ServiceModel, RouteModel];
  const knativeDeleteModels = [
    ConfigurationModel,
    RevisionModel,
    KnativeServiceModel,
    KnativeRouteModel,
    BuildConfigModel,
    ImageStreamModel,
  ];
  const deploymentsAnnotations = _.get(resource, 'metadata.annotations', {});
  const isKnativeResource = _.get(workload, 'data.isKnativeResource', false);
  const gitType = detectGitType(deploymentsAnnotations['app.openshift.io/vcs-uri']);
  const resourceData = _.cloneDeep(resource);
  const safeKill = async (model: K8sKind, obj: K8sResourceKind) => {
    const resp = await checkAccess({
      group: model.apiGroup,
      resource: model.plural,
      verb: 'delete',
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
    });
    if (resp.status.allowed) {
      return k8sKill(model, obj);
    }
    return null;
  };
  const deleteRequest = (model: K8sKind, resourceObj: K8sResourceKind) => {
    const req = safeKill(model, resourceObj);
    req && reqs.push(req);
  };
  const batchDeleteRequests = (models: K8sKind[], resourceObj: K8sResourceKind): void => {
    models.forEach((model) => deleteRequest(model, resourceObj));
  };
  if (isKnativeResource) {
    // delete knative resources
    const knativeService = _.find(workload.resources.ksservices, { kind: 'Service' });
    resourceData.metadata.name = _.get(knativeService, 'metadata.name', '');
    batchDeleteRequests(knativeDeleteModels, resourceData);
  } else {
    // delete non knative resources
    switch (resource.kind) {
      case DeploymentModel.kind:
        deleteRequest(DeploymentModel, resource);
        webhooksAvailable = false;
        break;
      case DeploymentConfigModel.kind:
        batchDeleteRequests(deleteModels, resource);
        deleteRequest(ImageStreamModel, resource); // delete imageStream
        break;
      case DaemonSetModel.kind:
        deleteRequest(DaemonSetModel, resource);
        webhooksAvailable = false;
        break;
      case StatefulSetModel.kind:
        deleteRequest(StatefulSetModel, resource);
        webhooksAvailable = false;
        break;
      default:
        webhooksAvailable = false;
        break;
    }
  }
  // Delete webhook secrets for both knative and non-knative resources
  if (webhooksAvailable) {
    webhooks.push('generic');
    if (!isKnativeResource && gitType !== GitTypes.unsure) {
      webhooks.push(gitType);
    }
  }
  webhooks.forEach((hookName) => {
    const obj = {
      ...resource,
      metadata: {
        name: `${resourceData.metadata.name}-${hookName}-webhook-secret`,
        namespace: resourceData.metadata.namespace,
      },
    };
    deleteRequest(SecretModel, obj);
  });
  return Promise.all(reqs);
};
