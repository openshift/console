import * as _ from 'lodash';
import {
  K8sKind,
  k8sGet,
  k8sList,
  k8sPatch,
  k8sKill,
  K8sResourceKind,
  modelFor,
  k8sCreate,
  LabelSelector,
  referenceFor,
  referenceForModel,
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
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import {
  ServiceModel as KnativeServiceModel,
  RouteModel as KnativeRouteModel,
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
  EventSourceServiceBindingModel,
} from '@console/knative-plugin';
import { checkAccess } from '@console/internal/components/utils';
import { getOperatorBackedServiceKindMap } from '@console/shared';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../const';
import { TopologyDataObject } from '../components/topology/topology-types';
import { detectGitType } from '../components/import/import-validation-utils';
import { GitTypes } from '../components/import/import-types';
import { ServiceBindingRequestModel } from '../models';

export const sanitizeApplicationValue = (
  application: string,
  applicationType: string = application,
): string => {
  switch (applicationType) {
    case UNASSIGNED_KEY:
    case CREATE_APPLICATION_KEY:
      return '';
    default:
      return application;
  }
};

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

export const edgesFromServiceBinding = (
  source: K8sResourceKind,
  sbrs: K8sResourceKind[],
): K8sResourceKind[] => {
  const sourceBindings = [];
  _.forEach(sbrs, (sbr) => {
    let edgeExists = false;
    if (_.get(sbr, 'spec.applicationSelector.resource') === modelFor(referenceFor(source)).plural) {
      if (_.get(sbr, 'spec.applicationSelector.resourceRef') === source.metadata.name) {
        edgeExists = true;
      } else {
        const matchLabels = _.has(sbr, 'spec.applicationSelector.matchLabels');
        if (matchLabels) {
          const sbrSelector = new LabelSelector(sbr.spec.applicationSelector);
          if (sbrSelector.matches(source)) {
            edgeExists = true;
          }
        }
      }
    }
    edgeExists && sourceBindings.push(sbr);
  });
  return sourceBindings;
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
    return Promise.reject(new Error('Error: no resource provided to update application for.'));
  }
  if (!resourceKind) {
    return Promise.reject(
      new Error('Error: invalid resource kind provided for updating application.'),
    );
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
  const model = modelFor(referenceFor(item) || item.kind);

  if (!model) {
    return Promise.reject(new Error(`Unable to retrieve model for: ${item.kind}`));
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

export const createServiceBinding = (
  source: K8sResourceKind,
  target: K8sResourceKind,
): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const targetName = _.get(target, 'metadata.name');
  const sourceName = _.get(source, 'metadata.name');
  const namespace = _.get(source, 'metadata.namespace');
  const sourceGroup = _.split(_.get(source, 'apiVersion'), '/');
  const targetResourceGroup = _.split(_.get(target, 'metadata.ownerReferences[0].apiVersion'), '/');
  const targetResourceKind = _.get(target, 'metadata.ownerReferences[0].kind');
  const targetResourceRefName = _.get(target, 'metadata.ownerReferences[0].name');
  const sbrName = `${sourceName}-${modelFor(referenceFor(source)).abbr}-${targetName}-${
    modelFor(target.kind).abbr
  }`;

  const serviceBindingRequest = {
    apiVersion: 'apps.openshift.io/v1alpha1',
    kind: 'ServiceBindingRequest',
    metadata: {
      name: sbrName,
      namespace,
    },
    spec: {
      applicationSelector: {
        resourceRef: sourceName,
        group: sourceGroup[0],
        version: sourceGroup[1],
        resource: modelFor(referenceFor(source)).plural,
      },
      backingServiceSelector: {
        group: targetResourceGroup[0],
        version: targetResourceGroup[1],
        kind: targetResourceKind,
        resourceRef: targetResourceRefName,
      },
      detectBindingResources: true,
    },
  };

  return k8sCreate(ServiceBindingRequestModel, serviceBindingRequest);
};

export const removeServiceBinding = (sbr: K8sResourceKind): Promise<any> => {
  return k8sKill(ServiceBindingRequestModel, sbr);
};

// Create a connection from the source to the target replacing the connection to replacedTarget if provided
export const createResourceConnection = (
  source: K8sResourceKind,
  target: K8sResourceKind,
  replacedTarget: K8sResourceKind = null,
): Promise<K8sResourceKind[] | K8sResourceKind> => {
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

  const patches: Promise<K8sResourceKind>[] = [
    updateItemAppConnectTo(source, connectValue, replaceValue),
  ];

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
  let webhooksAvailable = false;
  const deleteModels = [BuildConfigModel, ServiceModel, RouteModel];
  const knativeDeleteModels = [
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
  switch (resource.kind) {
    case DaemonSetModel.kind:
    case StatefulSetModel.kind:
      deleteRequest(modelFor(resource.kind), resource);
      break;
    case DeploymentModel.kind:
    case DeploymentConfigModel.kind:
      deleteRequest(modelFor(resource.kind), resource);
      batchDeleteRequests(deleteModels, resource);
      deleteRequest(ImageStreamModel, resource); // delete imageStream
      webhooksAvailable = true;
      break;
    case EventSourceCronJobModel.kind:
    case EventSourceApiServerModel.kind:
    case EventSourceContainerModel.kind:
    case EventSourceKafkaModel.kind:
    case EventSourceCamelModel.kind:
    case EventSourceServiceBindingModel.kind:
      deleteRequest(modelFor(referenceFor(resource)), resource);
      break;
    case KnativeServiceModel.kind:
      batchDeleteRequests(knativeDeleteModels, resourceData);
      webhooksAvailable = true;
      break;
    default:
      break;
  }
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

export const doContextualBinding = async (
  resources: K8sResourceKind[],
  contextualSource: string,
  serviceBindingAvailable: boolean = false,
): Promise<K8sResourceKind[]> => {
  if (!contextualSource) {
    return Promise.reject(new Error('Cannot do a contextual binding without a source'));
  }

  const linkingModelRefs = [
    referenceForModel(DeploymentConfigModel),
    referenceForModel(DeploymentModel),
  ];
  const newResource: K8sResourceKind = resources.find((resource) =>
    linkingModelRefs.includes(referenceFor(resource)),
  );

  if (!newResource) {
    // Not a resource we want to connect to
    return resources;
  }

  const {
    metadata: { namespace },
  } = newResource;
  const [groupVersionKind, resourceName] = contextualSource.split('/');
  const contextualResource: K8sResourceKind = await k8sGet(
    modelFor(groupVersionKind),
    resourceName,
    namespace,
  );

  if (!contextualResource) {
    return Promise.reject(
      new Error(`Cannot find resource (${contextualSource}) to do a contextual binding to`),
    );
  }

  if (serviceBindingAvailable) {
    const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(
      await k8sList(ClusterServiceVersionModel, { ns: namespace }),
    );
    const ownerResourceKind = newResource?.metadata?.ownerReferences?.[0]?.kind;
    const isOperatorBacked = ownerResourceKind in operatorBackedServiceKindMap;

    if (isOperatorBacked) {
      await createServiceBinding(contextualResource, newResource);
    }
  }

  await createResourceConnection(contextualResource, newResource);

  return resources;
};
