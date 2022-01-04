import * as _ from 'lodash';
import { BuildStrategyType } from '@console/internal/components/build';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { GitImportFormData, Resources } from '../../import/import-types';
import {
  getResourcesType,
  getFlowType,
  ApplicationFlowType,
  getInitialValues,
  getExternalImageValues,
  getServerlessData,
  getKsvcRouteData,
  getRouteLabels,
  getUserLabels,
  getFileUploadValues,
  BuildSourceType,
} from '../edit-application-utils';
import {
  knativeService,
  knAppResources,
  knExternalImageValues,
  appResources,
  gitImportInitialValues,
  externalImageValues,
  internalImageValues,
  gitImportInitialValuesWithHealthChecksEnabled,
} from './edit-application-data';

describe('getResourcesType', () => {
  it('should return resource type based on resource kind', () => {
    expect(getResourcesType(knativeService)).toEqual(Resources.KnativeService);
  });
});

describe('getFlowType', () => {
  it('should return page heading based on the create flow used to create the application', () => {
    expect(getFlowType(BuildStrategyType.Source)).toEqual(ApplicationFlowType.Git);
  });

  it('should return JarUpload based on the build type of resource', () => {
    expect(getFlowType(BuildStrategyType.Source, BuildSourceType.Binary)).toEqual(
      ApplicationFlowType.JarUpload,
    );
  });
});

describe('getInitialValues', () => {
  it('should return values based on the resources and the create flow used to create the application', () => {
    const { route, editAppResource, buildConfig, pipeline, imageStream } = appResources;
    const gitImportValues: GitImportFormData = {
      ...gitImportInitialValues,
      git: {
        ...gitImportInitialValues.git,
        ref: 'master',
      },
      pipeline: {
        enabled: true,
      },
      build: {
        ...gitImportInitialValues.build,
        source: { type: undefined },
        triggers: { config: false, image: false, webhook: false },
      },
      image: {
        ...gitImportInitialValues.image,
        tag: '',
      },
    };
    expect(
      getInitialValues({ pipeline, editAppResource, route }, 'nationalparks-py', 'div'),
    ).toEqual(gitImportValues);
    expect(
      getInitialValues({ buildConfig, editAppResource, route }, 'nationalparks-py', 'div'),
    ).toEqual(gitImportInitialValues);
    expect(
      getInitialValues({ buildConfig, editAppResource, route }, 'nationalparks-py', 'div'),
    ).toEqual(gitImportInitialValues);
    expect(
      getInitialValues({ editAppResource, route, imageStream }, 'nationalparks-py', 'div'),
    ).toEqual(externalImageValues);
    expect(getInitialValues({ editAppResource, route }, 'nationalparks-py', 'div')).toEqual(
      internalImageValues,
    );
  });

  it('should return values externalImageValues on the resources', () => {
    const { route, editAppResource, imageStream } = knAppResources;
    expect(
      getInitialValues({ editAppResource, route, imageStream }, 'nationalparks-py', 'div'),
    ).toEqual(knExternalImageValues);
  });

  it('should return health checks data based on the resources', () => {
    const { buildConfig, route, editAppResource } = appResources;
    editAppResource.data.spec.template.spec.containers[0].readinessProbe = {
      failureThreshold: 3,
      httpGet: {
        scheme: 'HTTP',
        path: '/',
        port: 8080,
        httpHeaders: [{ name: 'header', value: 'val' }],
      },
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 1,
      successThreshold: 1,
    };
    editAppResource.data.spec.template.spec.containers[0].livenessProbe = {
      failureThreshold: 3,
      exec: { command: ['cat', '/tmp/healthy'] },
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 1,
      successThreshold: 1,
    };
    expect(
      getInitialValues({ editAppResource, buildConfig, route }, 'nationalparks-py', 'div'),
    ).toEqual(gitImportInitialValuesWithHealthChecksEnabled);
  });
});

describe('getFileUploadValues', () => {
  it('should get correct data for fileupload values', () => {
    const { buildConfig, editAppResource } = appResources;
    expect(getFileUploadValues(editAppResource.data, buildConfig.data)).toEqual({
      fileUpload: { name: 'demo-app.jar', value: '', javaArgs: '' },
      runtimeIcon: 'python',
    });
  });
});

describe('getExternalImagelValues', () => {
  it('should return image name in search term', () => {
    const externalImageData = getExternalImageValues(knativeService);
    expect(_.get(externalImageData, 'searchTerm')).toEqual('openshift/hello-openshift');
  });
});

describe('getServerlessData', () => {
  let knativeServiceData: K8sResourceKind;

  beforeEach(() => {
    knativeServiceData = _.cloneDeep(knativeService);
  });

  it('should return correct autoscalewindow values', () => {
    knativeServiceData.spec = {
      template: {
        metadata: {
          annotations: {
            'autoscaling.knative.dev/window': '60s',
          },
        },
      },
    };
    const serverlessData = getServerlessData(knativeServiceData);
    expect(serverlessData.scaling.autoscale.autoscalewindow).toBe(60);
    expect(serverlessData.scaling.autoscale.autoscalewindowUnit).toBe('s');
  });

  it('should return correct autoscalewindow values when stable-window annotation has empty value', () => {
    knativeServiceData.spec = {
      template: {
        metadata: {
          annotations: {
            'autoscaling.knative.dev/window': '',
          },
        },
      },
    };
    const serverlessData = getServerlessData(knativeServiceData);
    expect(serverlessData.scaling.autoscale.autoscalewindow).toBe('');
    expect(serverlessData.scaling.autoscale.autoscalewindowUnit).toBe('s');
  });

  it('should return correct values', () => {
    knativeServiceData.spec = {
      template: {
        metadata: {
          annotations: {
            'autoscaling.knative.dev/maxScale': '2',
            'autoscaling.knative.dev/window': '60s',
            'autoscaling.knative.dev/target': '100',
            'autoscaling.knative.dev/targetUtilizationPercentage': '70',
            'autoscaling.knative.dev/minScale': '1',
          },
        },
        spec: {
          containerConcurrency: '3',
        },
      },
    };
    const expectedValue = {
      scaling: {
        minpods: '1',
        maxpods: '2',
        concurrencytarget: '100',
        concurrencylimit: '3',
        autoscale: {
          autoscalewindow: 60,
          autoscalewindowUnit: 's',
          defaultAutoscalewindowUnit: 's',
        },
        concurrencyutilization: '70',
      },
      domainMapping: [],
    };
    const serverlessData = getServerlessData(knativeServiceData);
    expect(serverlessData).toEqual(expectedValue);
  });
});

describe('getKsvcRouteData', () => {
  it('should return values of route based on the resource', () => {
    const routeData = {
      create: true,
      unknownTargetPort: '',
      targetPort: '',
      defaultUnknownPort: 8080,
    };
    expect(getKsvcRouteData(knativeService)).toEqual(routeData);
  });

  it('should return values of route(clusterlocal and ports) based on the resource', () => {
    const routeData = {
      create: true,
      unknownTargetPort: '8080',
      targetPort: '8080',
      defaultUnknownPort: 8080,
    };
    const ksvcData = {
      ...knativeService,
      metadata: {
        ...knativeService.metadata,
        labels: {
          'networking.knative.dev/visibility': 'cluster-local',
        },
      },
      spec: {
        template: {
          spec: {
            containers: [
              {
                ...knativeService.spec.template.spec.containers[0],
                ports: [
                  {
                    containerPort: 8080,
                  },
                ],
              },
            ],
          },
        },
      },
    };
    expect(getKsvcRouteData(ksvcData)).toEqual(routeData);
  });
});

describe('getRouteLabels', () => {
  it('should return an empty object when resource has no labels', () => {
    const route: K8sResourceKind = {};
    const resource: K8sResourceKind = {};
    const routeLabels = getRouteLabels(route, resource);
    expect(routeLabels).toEqual({});
  });

  it('should return route labels without default values', () => {
    const route: K8sResourceKind = {
      metadata: {
        labels: {
          'route-label': 'route-label-value',
          // some default values which are automatically added in the import flow
          app: 'my-app',
          'app.openshift.io/runtime': 'nodejs',
        },
      },
    };
    const resource: K8sResourceKind = {};
    const routeLabels = getRouteLabels(route, resource);
    expect(routeLabels).toEqual({
      'route-label': 'route-label-value',
    });
  });

  it('should return route labels but skip labels from parent resource', () => {
    const route: K8sResourceKind = {
      metadata: {
        labels: {
          'route-label': 'route-label-value',
          'label-on-all-resources': 'shared-value',
        },
      },
    };
    const resource: K8sResourceKind = {
      metadata: {
        labels: {
          'label-on-all-resources': 'shared-value',
        },
      },
    };
    const routeLabels = getRouteLabels(route, resource);
    expect(routeLabels).toEqual({
      'route-label': 'route-label-value',
    });
  });
});

describe('getUserLabels', () => {
  it('should return an empty object when resource has no labels', () => {
    const resource: K8sResourceKind = {};
    const routeLabels = getUserLabels(resource);
    expect(routeLabels).toEqual({});
  });

  it('should return route labels without default values', () => {
    const resource: K8sResourceKind = {
      metadata: {
        labels: {
          'custom-label': 'custom-label-value',
          // some default values which are automatically added in the import flow
          app: 'my-app',
          'app.openshift.io/runtime': 'nodejs',
        },
      },
    };
    const routeLabels = getUserLabels(resource);
    expect(routeLabels).toEqual({
      'custom-label': 'custom-label-value',
    });
  });
});
