import * as _ from 'lodash';
import {
  BuildConfigModel,
  DeploymentConfigModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { SelectorInput } from '@console/internal/components/utils';
import { createKnativeService } from '@console/knative-plugin/src/utils/create-knative-utils';
import { makePortName } from '../../utils/imagestream-utils';
import { getAppLabels, getPodLabels } from '../../utils/resource-label-utils';
import { DeployImageFormData } from './import-types';

const annotations = {
  'openshift.io/generated-by': 'OpenShiftWebConsole',
};

const volumes = [];
const volumeMounts = [];

const dryRunOpt = { queryParams: { dryRun: 'All' } };

export const createImageStream = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { name: isiName, tag },
    labels: userLabels,
  } = formData;
  const defaultLabels = getAppLabels(name, application, isiName);
  const imageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
    spec: {
      tags: [
        {
          name: tag,
          annotations: {
            ...annotations,
            'openshift.io/imported-from': isiName,
          },
          from: {
            kind: 'DockerImage',
            name: `${isiName}:${tag}`,
          },
          importPolicy: {},
        },
      ],
    },
  };

  return k8sCreate(ImageStreamModel, imageStream, dryRun ? dryRunOpt : {});
};

export const createBuildConfig = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { name: isiName, tag },
    build: { env, triggers },
    labels: userLabels,
  } = formData;

  const defaultLabels = getAppLabels(name, application, isiName);
  const buildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
    spec: {
      output: {
        to: {
          kind: 'ImageStreamTag',
          name: `${name}:latest`,
        },
      },
      strategy: {
        type: 'Source',
        sourceStrategy: {
          env,
          from: {
            kind: 'ImageStreamTag',
            name: `${isiName}:${tag}`,
            namespace,
          },
        },
      },
      triggers: [
        ...(triggers.image ? [{ type: 'ImageChange', imageChange: {} }] : []),
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };

  return k8sCreate(BuildConfigModel, buildConfig, dryRun ? dryRunOpt : {});
};

export const createDeploymentConfig = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    searchTerm,
    isi: { name: isiName, tag, ports },
    deployment: { env, replicas, triggers },
    labels: userLabels,
  } = formData;

  const defaultLabels = getAppLabels(name, application, isiName);
  const labels = _.isEmpty(userLabels) ? { app: application } : SelectorInput.objectify(userLabels);

  const deploymentConfig = {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations,
    },
    spec: {
      replicas,
      selector: labels,
      template: {
        metadata: {
          labels,
          annotations,
        },
        spec: {
          volumes,
          containers: [
            {
              name,
              image: `${searchTerm}:latest`,
              ports,
              volumeMounts,
              env,
            },
          ],
        },
      },
      triggers: [
        {
          type: 'ImageChange',
          imageChangeParams: {
            automatic: triggers.image,
            containerNames: [name],
            from: {
              kind: 'ImageStreamTag',
              name: `${name}:${tag}`,
            },
          },
        },
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };

  return k8sCreate(DeploymentConfigModel, deploymentConfig, dryRun ? dryRunOpt : {});
};

export const createService = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { name: isiName, ports },
    labels: userLabels,
  } = formData;

  const defaultLabels = getAppLabels(name, application, isiName);
  const podLabels = getPodLabels(name);
  const service = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations,
    },
    spec: {
      selector: podLabels,
      ports: _.map(ports, (port) => ({
        port: port.containerPort,
        targetPort: port.containerPort,
        protocol: port.protocol,
        // Use the same naming convention as CLI new-app.
        name: `${port.containerPort}-${port.protocol}`.toLowerCase(),
      })),
    },
  };

  return k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {});
};

export const createRoute = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { name: isiName, ports },
    labels: userLabels,
  } = formData;

  const firstPort = _.head(ports);
  const defaultLabels = getAppLabels(name, application, isiName);
  const route = {
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations,
    },
    spec: {
      to: {
        kind: 'Service',
        name,
      },
      // The service created by `createService` uses the same port as the container port.
      port: {
        // Use the port name, not the number for targetPort. The router looks
        // at endpoints, not services, when resolving ports, so port numbers
        // will not resolve correctly if the service port and container port
        // numbers don't match.
        targetPort: makePortName(firstPort),
      },
      wildcardPolicy: 'None',
    },
  };

  return k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {});
};

export const createResources = (
  formData: DeployImageFormData,
  dryRun: boolean = false,
): Promise<K8sResourceKind[]> => {
  const {
    route: { create: canCreateRoute },
    project: { name: projectName },
    name,
    isi: { name: isiName, tag, ports },
  } = formData;

  const requests: Promise<K8sResourceKind>[] = [];
  if (!formData.serverless.trigger) {
    requests.push(createDeploymentConfig(formData, dryRun));
    requests.push(createImageStream(formData, dryRun));
    requests.push(createBuildConfig(formData, dryRun));

    if (!_.isEmpty(ports)) {
      requests.push(createService(formData, dryRun));
      if (canCreateRoute) {
        requests.push(createRoute(formData, dryRun));
      }
    }
  } else if (!dryRun) {
    // Do not run serverless call during the dry run.
    requests.push(
      createKnativeService(name, projectName, formData.serverless.scaling, isiName, tag),
    );
  }

  return Promise.all(requests);
};
