import * as _ from 'lodash';
import {
  K8sKind,
  k8sGet,
  k8sList,
  k8sPatch,
  k8sKill,
  K8sResourceKind,
  modelFor,
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
  JobModel,
  CronJobModel,
} from '@console/internal/models';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin/src/models';
import { isDynamicEventResourceKind } from '@console/knative-plugin/src/utils/fetch-dynamic-eventsources-utils';
import { checkAccess } from '@console/internal/components/utils';
import { getOperatorBackedServiceKindMap } from '@console/shared';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../const';
import {
  TopologyDataObject,
  ConnectsToData,
  OdcNodeModel,
} from '../components/topology/topology-types';
import { detectGitType } from '../components/import/import-validation-utils';
import { createServiceBinding } from '../components/topology/operators/actions/serviceBindings';

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

export const edgesFromAnnotations = (annotations): (string | ConnectsToData)[] => {
  let edges: (string | ConnectsToData)[] = [];
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
  connections: (string | ConnectsToData)[],
  connectValue: ConnectsToData,
  oldValueIndex: number,
) => {
  const model = modelFor(referenceFor(item) || item.kind);

  if (!model) {
    return Promise.reject(new Error(`Unable to retrieve model for: ${item.kind}`));
  }

  const tags = _.toPairs(item.metadata.annotations);
  let op = _.size(tags) ? 'replace' : 'add';

  const existingTag = _.find(tags, (tag) => tag[0] === 'app.openshift.io/connects-to');
  if (existingTag) {
    if (connections.includes(connectValue)) {
      return Promise.resolve();
    }

    if (!connectValue) {
      _.pullAt(connections, [oldValueIndex]);
    } else if (oldValueIndex >= 0) {
      connections[oldValueIndex] = connectValue;
    } else {
      connections.push(connectValue);
    }
    existingTag[1] = _.size(connections) && JSON.stringify(connections);

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

    const connectionTag: [string, string] = [
      'app.openshift.io/connects-to',
      JSON.stringify([connectValue]),
    ];
    tags.push(connectionTag);
  }

  const patch = [{ path: '/metadata/annotations', op, value: _.fromPairs(tags) }];

  return k8sPatch(model, item, patch);
};

// Get the index of the replaced target of the visual connector
const getReplacedTargetIndex = (
  replacedTarget: K8sResourceKind,
  connections: (string | ConnectsToData)[],
): number => {
  if (replacedTarget) {
    const replaceTargetName = replacedTarget.metadata?.name;
    const replaceTargetKind = replacedTarget.kind;
    const replaceTargetApiVersion = replacedTarget.apiVersion;
    const replaceValue = {
      apiVersion: replaceTargetApiVersion,
      kind: replaceTargetKind,
      name: replaceTargetName,
    };
    const replaceTargetInstanceName =
      replacedTarget.metadata?.labels?.['app.kubernetes.io/instance'];
    let index = _.findIndex(connections, replaceValue);
    if (index === -1) {
      index = _.findIndex(
        connections,
        (connection) => connection === (replaceTargetInstanceName || replaceTargetName),
      );
    }
    return index;
  }
  return -1;
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

  const connectTargetName = target.metadata?.name;
  const connectTargetKind = target.kind;
  const connectTargetApiVersion = target.apiVersion;
  const connectValue = {
    apiVersion: connectTargetApiVersion,
    kind: connectTargetKind,
    name: connectTargetName,
  };

  const connections = edgesFromAnnotations(source.metadata?.annotations);

  const replacedTargetIndex = getReplacedTargetIndex(replacedTarget, connections);

  const instanceName = _.get(source, ['metadata', 'labels', 'app.kubernetes.io/instance']);

  const patches: Promise<K8sResourceKind>[] = [
    updateItemAppConnectTo(source, connections, connectValue, replacedTargetIndex),
  ];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // Update all the instance's resources that were part of the previous application
  return listInstanceResources(source.metadata.namespace, instanceName).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        patches.push(updateItemAppConnectTo(item, connections, connectValue, replacedTargetIndex));
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
  const connections = edgesFromAnnotations(source.metadata?.annotations);

  const replacedTargetIndex = getReplacedTargetIndex(target, connections);

  const instanceName = _.get(source, ['metadata', 'labels', 'app.kubernetes.io/instance']);

  const patches: Promise<any>[] = [
    updateItemAppConnectTo(source, connections, null, replacedTargetIndex),
  ];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // Update all the instance's resources that were part of the previous application
  return listInstanceResources(source.metadata.namespace, instanceName).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        patches.push(updateItemAppConnectTo(item, connections, null, replacedTargetIndex));
      });
    });

    return Promise.all(patches);
  });
};

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

const deleteWebhooks = (
  resource: K8sResourceKind,
  workload: TopologyDataObject<{ isKnativeResource?: boolean }>,
) => {
  const isKnativeResource = workload?.data?.isKnativeResource ?? false;
  const deploymentsAnnotations = resource.metadata?.annotations ?? {};
  const gitType = detectGitType(deploymentsAnnotations['app.openshift.io/vcs-uri']);
  const buildConfigs = workload?.resources?.buildConfigs;
  return buildConfigs?.reduce((requests, bc) => {
    const triggers = bc.spec?.triggers ?? [];
    const reqs = triggers.reduce((a, t) => {
      let obj: K8sResourceKind;
      const webhookType = t.generic ? 'generic' : gitType;
      const webhookTypeObj = t.generic || (!isKnativeResource && t[gitType]);
      if (webhookTypeObj) {
        obj = {
          ...resource,
          metadata: {
            name:
              webhookTypeObj.secretReference?.name ??
              `${resource.metadata.name}-${webhookType}-webhook-secret`,
            namespace: resource.metadata.namespace,
          },
        };
      }
      return obj ? [...a, safeKill(SecretModel, obj)] : a;
    }, []);
    return [...requests, ...reqs];
  }, []);
};

export const cleanUpWorkload = async (workload: OdcNodeModel): Promise<K8sResourceKind[]> => {
  const { resource } = workload;
  const reqs = [];
  const isBuildConfigPresent = !_.isEmpty(workload.data?.resources?.buildConfigs);
  const isImageStreamPresent = await k8sGet(
    ImageStreamModel,
    resource.metadata.name,
    resource.metadata.namespace,
  )
    .then(() => true)
    .catch(() => false);
  const deleteModels = [ServiceModel, RouteModel];
  const knativeDeleteModels = [KnativeServiceModel];
  if (isBuildConfigPresent) {
    deleteModels.push(BuildConfigModel);
    knativeDeleteModels.push(BuildConfigModel);
  }
  if (isImageStreamPresent) {
    deleteModels.push(ImageStreamModel);
    knativeDeleteModels.push(ImageStreamModel);
  }
  const resourceData = _.cloneDeep(resource);
  const deleteRequest = (model: K8sKind, resourceObj: K8sResourceKind) => {
    const req = safeKill(model, resourceObj);
    req && reqs.push(req);
  };
  const batchDeleteRequests = (models: K8sKind[], resourceObj: K8sResourceKind): void => {
    models.forEach((model) => deleteRequest(model, resourceObj));
  };
  if (isDynamicEventResourceKind(referenceFor(resource)))
    deleteRequest(modelFor(referenceFor(resource)), resource);
  switch (resource.kind) {
    case DaemonSetModel.kind:
    case StatefulSetModel.kind:
    case JobModel.kind:
    case CronJobModel.kind:
      deleteRequest(modelFor(resource.kind), resource);
      break;
    case DeploymentModel.kind:
    case DeploymentConfigModel.kind:
      deleteRequest(modelFor(resource.kind), resource);
      batchDeleteRequests(deleteModels, resource);
      break;
    case KnativeServiceModel.kind:
      batchDeleteRequests(knativeDeleteModels, resourceData);
      break;
    default:
      break;
  }
  isBuildConfigPresent && reqs.push(...deleteWebhooks(resource, workload.data));
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
