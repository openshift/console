import i18next from 'i18next';
import * as _ from 'lodash';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import {
  allModels,
  k8sGet,
  K8sKind,
  k8sList,
  k8sPatch,
  K8sResourceKind,
  kindForReference,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { createServiceBinding } from '../operators/actions/serviceBindings';

export type ConnectsToData = { apiVersion: string; kind: string; name: string };

const getModel = (groupVersionKind: string): K8sKind => {
  const m = allModels().get(groupVersionKind);
  if (m) {
    return m;
  }
  return allModels().get(kindForReference(groupVersionKind));
};

const fetchResource = async (source: string, namespace: string) => {
  const [groupVersionKind, resourceName] = source.split('/');
  const contextualResource: K8sResourceKind = await k8sGet(
    getModel(groupVersionKind),
    resourceName,
    namespace,
  );
  return contextualResource;
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

export const listInstanceResources = (
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
      k8sList(getModel(kind), {
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

// Updates the item to add an new connect's to value replacing an old value if provided
export const updateItemAppConnectTo = (
  item: K8sResourceKind,
  connections: (string | ConnectsToData)[],
  connectValue: ConnectsToData,
  oldValueIndex: number,
) => {
  const model = getModel(referenceFor(item) || item.kind);

  if (!model) {
    return Promise.reject(
      new Error(i18next.t('topology~Unable to retrieve model for: {{kind}}', { kind: item.kind })),
    );
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

const getSourceAndTargetForBinding = async (
  resources: K8sResourceKind[] | K8sResourceKind,
  contextualSource: string,
  serviceBindingAvailable?: boolean,
): Promise<{ source: K8sResourceKind; target: K8sResourceKind }> => {
  if (!contextualSource) {
    return Promise.reject(
      new Error(i18next.t('topology~Cannot do a contextual binding without a source')),
    );
  }
  const linkingModelRefs = [
    referenceForModel(DeploymentConfigModel),
    referenceForModel(DeploymentModel),
  ];
  let target;
  if (serviceBindingAvailable || !Array.isArray(resources)) {
    target = resources;
  } else {
    target = (resources as K8sResourceKind[]).find((resource) =>
      linkingModelRefs.includes(referenceFor(resource)),
    );
  }
  const {
    metadata: { namespace },
  } = target;
  const source: K8sResourceKind = await fetchResource(contextualSource, namespace);
  if (!source) {
    return Promise.reject(
      new Error(
        i18next.t(
          'topology~Cannot find resource ({{contextualSource}}) to do a contextual binding to',
          {
            contextualSource,
          },
        ),
      ),
    );
  }

  return { source, target };
};

export const doConnectsToBinding = async (
  resources: K8sResourceKind[],
  contextualSource: string,
): Promise<K8sResourceKind[]> => {
  const { source, target } = await getSourceAndTargetForBinding(resources, contextualSource);
  if (!target) {
    // Not a resource we want to connect to
    return resources;
  }
  await createResourceConnection(source, target);

  return resources;
};

export const doContextualBinding = async (
  target: K8sResourceKind,
  contextualSource: string,
): Promise<K8sResourceKind> => {
  const { source } = await getSourceAndTargetForBinding(target, contextualSource, true);
  await createServiceBinding(source, target);
  return target;
};
