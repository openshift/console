import * as _ from 'lodash-es';
import { coFetchJSON } from '../../co-fetch';
import { k8sBasePath } from './k8s';
// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
import { K8sKind, K8sResourceKind } from './types';
import { selectorToString } from './selector';
import { WSFactory } from '../ws-factory';


/** @type {(model: K8sKind) => string} */
const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }) => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  let p = isLegacy ? '/api/' : '/apis/';

  if (!isLegacy && apiGroup) {
    p += `${apiGroup}/`;
  }

  p += apiVersion;
  return p;
};

/** @type {(model: K8sKind, options: {ns?: string, name?: string, path?: string, queryParams?: {[k: string]: string}}) => string} */
export const getK8sResourcePath = (model, options) => {
  let q = '';
  let u = getK8sAPIPath(model);

  if (options.ns) {
    u += `/namespaces/${options.ns}`;
  }
  u += `/${model.plural}`;
  if (options.name) {
    // Some resources like Users can have special characters in the name.
    u += `/${encodeURIComponent(options.name)}`;
  }
  if (options.path) {
    u += `/${options.path}`;
  }
  if (!_.isEmpty(options.queryParams)) {
    q = _.map(options.queryParams, function(v, k) {
      return `${k}=${v}`;
    });
    u += `?${q.join('&')}`;
  }

  return u;
};

/** @type {(model: K8sKind, options: {ns?: string, name?: string, path?: string, queryParams?: {[k: string]: string}}) => string} */
export const resourceURL = (model, options) =>
  `${k8sBasePath}${getK8sResourcePath(model, options)}`;

export const watchURL = (kind, options) => {
  const opts = options || {};

  opts.queryParams = opts.queryParams || {};
  opts.queryParams.watch = true;
  return resourceURL(kind, opts);
};

export const k8sGet = (kind, name, ns, opts) =>
  coFetchJSON(resourceURL(kind, Object.assign({ ns, name }, opts)));

export const k8sCreate = (kind, data, opts = {}) => {
  // // Occassionally, a resource won't have a metadata property.
  // // For example: apps.openshift.io/v1 DeploymentRequest
  // // https://github.com/openshift/api/blob/master/apps/v1/types.go
  // data.metadata = data.metadata || {};

  // // Lowercase the resource name
  // // https://github.com/kubernetes/kubernetes/blob/HEAD/docs/user-guide/identifiers.md#names
  // if (data.metadata.name && _.isString(data.metadata.name) && !data.metadata.generateName) {
  //   data.metadata.name = data.metadata.name.toLowerCase();
  // }


  return coFetchJSON.post(
    resourceURL(kind, Object.assign({ ns: data?.metadata?.namespace }, opts)),
    data,
  );
};

export const devfileCreate = (kind, data, opts = {}) => {

  data.metadata = data.metadata || {};
  data.metadata.namespace = data.metadata.namespace || "default";

  let isMock = true; 
  data.defaultAnnotations['isFromDevfile'] = "true"
  let buildStrategyData = {
    dockerStrategy: { env:data.build.buildEnv, dockerfilePath: "Dockerfile" }
  };

  let devfileResources; 
  if(isMock) {

    //devfile obj here, return 
    devfileResources = {
     imageStream : {
      apiVersion: 'image.openshift.io/v1',
      kind: 'ImageStream',
      metadata: {
        name: `${data.generatedImageStreamName || data.name}`,
        namespace: data.namespace,
        labels: { ...data.defaultLabels, ...data.userLabels },
        annotations: data.defaultAnnotations,
      }
     },
     buildResource: {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {
          name: data.name,
          namespace: data.namespace,
          labels: { ...data.defaultLabels, ...data.userLabels },
          annotations: data.defaultAnnotations,
        },
        spec: {
          output: {
            to: {
              kind: 'ImageStreamTag',
              name: `${data.generatedImageStreamName || data.name}:latest`,
            },
          },
          source: {
            contexDir: data.git.dir,
            git: {
              uri: data.git.url,
              ref: data.git.ref,
              type: 'Git',
            },
            ...(data.git.secretName ? { sourceSecret: { name: data.git.secretName } } : {}),
          },
          strategy: {
            type: 'Docker',
            ...buildStrategyData,
          },
          triggers: [
            {
              type: 'Generic',
              generic: {
                secretReference: { name: `${data.name}-generic-webhook-secret` },
              },
            },
            ...(data.build.triggers.webhook && data.git.type !== 'other' ? [data.webhookTriggerData] : []),
            ...(data.build.triggers.image ? [{ type: 'ImageChange', imageChange: {} }] : []),
            ...(data.build.triggers.config ? [{ type: 'ConfigChange' }] : []),
          ],
        }, 
      },
     deployResource: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: data.name,
          namespace: data.namespace,
          labels: { ...data.defaultLabels, ...data.userLabels },
          annotations: data.annotations,
        },
        spec: {
          selector: {
            matchLabels: {
              app: data.name,
            },
          },
          replicas: data.deployment.replicas,
          template: {
            metadata: {
              labels: { ...data.userLabels, ...data.podLabels },
            },
            spec: {
              containers: [
                {
                  name: data.name,
                  image: `${data.name}:latest`,
                  ports: data.image.ports,
                  env: data.deployment.deployEnv,
                  resources: {
                    ...((data.limits.cpu.limit || data.limits.memory.limit) && {
                      limits: {
                        ...(data.limits.cpu.limit && { cpu: `${data.limits.cpu.limit}${data.limits.cpu.limitUnit}` }),
                        ...(data.limits.memory.limit && { memory: `${data.limits.memory.limit}${data.limits.memory.limitUnit}` }),
                      },
                    }),
                    ...((data.limits.cpu.request || data.limits.memory.request) && {
                      requests: {
                        ...(data.limits.cpu.request && { cpu: `${data.limits.cpu.request}${data.limits.cpu.requestUnit}` }),
                        ...(data.limits.memory.request && { memory: `${data.limits.memory.request}${data.limits.memory.requestUnit}` }),
                      },
                    }),
                  },
                  ...data.probesData,
                },
              ],
            },
          },
        },
      },
     service: {
        kind: 'Service',
        apiVersion: 'v1',
        metadata: {
          name: data.name,
          namespace: data.namespace,
          labels: { ...data.defaultLabels, ...data.userLabels },
          annotations: data.defaultAnnotations,
        },
        spec: {
          selector: data.podLabels,
          ports: _.map(data.image.ports, (port) => ({
            port: port.containerPort,
            targetPort: port.containerPort,
            protocol: port.protocol,
            // Use the same naming convention as CLI new-app.
            name: `${port.containerPort}-${port.protocol}`.toLowerCase(),
          })),
        },
      },
     route: {
        kind: 'Route',
        apiVersion: 'route.openshift.io/v1',
        metadata: {
          name: data.name,
          namespace: data.namespace,
          labels: { ...data.defaultLabels, ...data.userLabels },
          annotations: data.defaultAnnotations,
        },
        spec: {
          to: {
            kind: 'Service',
            name: data.name,
          },
          ...(data.routeSpec.secure ? { tls: data.routeSpec.tls } : {}),
          host: data.routeSpec.hostname,
          path: data.routeSpec.path,
          // The service created by `createService` uses the same port as the container port.
          port: {
            // Use the port name, not the number for targetPort. The router looks
            // at endpoints, not services, when resolving ports, so port numbers
            // will not resolve correctly if the service port and container port
            // numbers don't match.
            targetPort: `${data.routeSpec.targetPort.containerPort}-${data.routeSpec.targetPort.protocol}`.toLowerCase(),
          },
          wildcardPolicy: 'None',
        },
      },
    //  webhookSecret: {
    //     apiVersion: 'v1',
    //     data: {},
    //     kind: 'Secret',
    //     metadata: {
    //       name: `${data.name}-generic-webhook-secret`,
    //       namespace: data.namespace,
    //     },
    //     stringData: { WebHookSecretKey: data.webhookSecret },
    //     type: SecretType.opaque,
    //   }
    }
     
  }
  return devfileResources;
  // let temp = coFetchJSON.post(resourceURL(kind, Object.assign({ ns: data.metadata.namespace }, opts)),
  //   data,);
  // return temp;
  // return coFetchJSON.post(
  //   resourceURL(kind, Object.assign({ ns: data.metadata.namespace }, opts)),
  //   data,
  // );
};

export const k8sUpdate = (kind, data, ns, name, opts) =>
  coFetchJSON.put(
    resourceURL(kind, {
      ns: ns || data.metadata.namespace,
      name: name || data.metadata.name,
      ...opts,
    }),
    data,
  );

export const k8sPatch = (kind, resource, data, opts = {}) => {
  const patches = _.compact(data);

  if (_.isEmpty(patches)) {
    return Promise.resolve(resource);
  }

  return coFetchJSON.patch(
    resourceURL(
      kind,
      Object.assign(
        {
          ns: resource.metadata.namespace,
          name: resource.metadata.name,
        },
        opts,
      ),
    ),
    patches,
  );
};

export const k8sPatchByName = (kind, name, namespace, data, opts = {}) =>
  k8sPatch(kind, { metadata: { name, namespace } }, data, opts);

export const k8sKill = (kind, resource, opts = {}, json = null) =>
  coFetchJSON.delete(
    resourceURL(
      kind,
      Object.assign({ ns: resource.metadata.namespace, name: resource.metadata.name }, opts),
    ),
    opts,
    json,
  );

export const k8sKillByName = (kind, name, namespace, opts = {}) =>
  k8sKill(kind, { metadata: { name, namespace } }, opts);

export const k8sList = (kind, params = {}, raw = false, options = {}) => {
  const query = _.map(_.omit(params, 'ns'), (v, k) => {
    if (k === 'labelSelector') {
      v = selectorToString(v);
    }
    return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  }).join('&');

  const listURL = resourceURL(kind, { ns: params.ns });
  return coFetchJSON(`${listURL}?${query}`, 'GET', options).then((result) => {
    const typedItems = result.items?.map((i) => ({
      kind: kind.kind,
      apiVersion: result.apiVersion,
      ...i,
    }));
    return raw ? { ...result, items: typedItems } : typedItems;
  });
};

export const k8sListPartialMetadata = (kind, params = {}, raw = false) => {
  return k8sList(kind, params, raw, {
    headers: {
      Accept:
        'application/json;as=PartialObjectMetadataList;v=v1beta1;g=meta.k8s.io,application/json',
    },
  });
};

export const k8sWatch = (kind, query = {}, wsOptions = {}) => {
  const queryParams = { watch: true };
  const opts = { queryParams };
  wsOptions = Object.assign(
    {
      host: 'auto',
      reconnect: true,
      jsonParse: true,
      bufferFlushInterval: 500,
      bufferMax: 1000,
    },
    wsOptions,
  );

  const labelSelector = query.labelSelector || kind.labelSelector;
  if (labelSelector) {
    const encodedSelector = encodeURIComponent(selectorToString(labelSelector));
    if (encodedSelector) {
      queryParams.labelSelector = encodedSelector;
    }
  }

  if (query.fieldSelector) {
    queryParams.fieldSelector = encodeURIComponent(query.fieldSelector);
  }

  if (query.ns) {
    opts.ns = query.ns;
  }

  if (query.resourceVersion) {
    queryParams.resourceVersion = encodeURIComponent(query.resourceVersion);
  }

  const path = resourceURL(kind, opts);
  wsOptions.path = path;
  return new WSFactory(path, wsOptions);
};

/**
 * Use k8sWatch to wait for a resource to get into an expected condition.
 * Watches for resource by kind, namespace and optional name.
 * Promise resolves to a new resource version or rejects with a timeout.
 * @param {K8sKind} kind
 * @param {K8sResourceKind} resource
 * @param {(kind: K8sResourceKind) => boolean} checkCondition
 * @param {number} timeoutInMs
 * @returns {Promise<K8sResourceKind>}
 */
export const k8sWaitForUpdate = (kind, resource, checkCondition, timeoutInMs) => {
  const { namespace, name, resourceVersion } = resource.metadata;

  if (checkCondition(resource)) {
    return Promise.resolve(resource);
  }

  const watcher = k8sWatch(kind, {
    ns: namespace,
    resourceVersion,
  });
  const closeConnection = () => watcher.destroy();

  const waitForCondition = new Promise((resolve, reject) => {
    watcher.onbulkmessage((messages) => {
      messages.forEach(({ object }) => {
        if ((!name || name === object.metadata?.name) && checkCondition(object)) {
          resolve(object);
        }
      });
    });
    watcher.onclose(() => reject(new Error('Connection closed')));
    watcher.ondestroy(() => reject(new Error('Connection destroyed')));
  });

  const waitForTimeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timed out waiting for resource to finish')), timeoutInMs);
  });

  return Promise.race([waitForCondition, waitForTimeout]).finally(closeConnection);
};
