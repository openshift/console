import * as _ from 'lodash';
import { BuildStrategyType } from '@console/internal/components/build';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  getResourcesType,
  getPageHeading,
  CreateApplicationFlow,
  getInitialValues,
  getExternalImagelValues,
  getServerlessData,
} from '../edit-application-utils';
import { GitImportFormData, Resources } from '../../import/import-types';
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

describe('Edit Application Utils', () => {
  it('getResourcesType should return resource type based on resource kind', () => {
    expect(getResourcesType(knativeService)).toEqual(Resources.KnativeService);
  });

  it('getPageHeading should return page heading based on the create flow used to create the application', () => {
    expect(getPageHeading(BuildStrategyType.Source)).toEqual(CreateApplicationFlow.Git);
  });

  it('getInitialValues should return values based on the resources and the create flow used to create the application', () => {
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

  it('getExternalImagelValues should return image name in search term', () => {
    const externalImageData = getExternalImagelValues(knativeService);
    expect(_.get(externalImageData, 'searchTerm')).toEqual('openshift/hello-openshift');
  });

  it('getInitialValues should return values externalImageValues on the resources', () => {
    const { route, editAppResource, imageStream } = knAppResources;
    expect(
      getInitialValues({ editAppResource, route, imageStream }, 'nationalparks-py', 'div'),
    ).toEqual(knExternalImageValues);
  });

  it('getInitialValues should return health checks data based on the resources', () => {
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

  describe('getServerlessData', () => {
    let knativeServiceData: K8sResourceKind;
    beforeEach(() => {
      knativeServiceData = _.cloneDeep(knativeService);
    });
    it('getServerlessData should return correct autoscalewindow values', () => {
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
      expect(serverlessData.scaling.autoscale.autoscalewindow).toBe('60');
      expect(serverlessData.scaling.autoscale.autoscalewindowUnit).toBe('s');
    });
    it('getServerlessData should return correct autoscalewindow values when stable-window annotation has empty value', () => {
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
    it('getServerlessData should return correct values', () => {
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
            autoscalewindow: '60',
            autoscalewindowUnit: 's',
            defaultAutoscalewindowUnit: 's',
          },
          concurrencyutilization: '70',
        },
      };
      const serverlessData = getServerlessData(knativeServiceData);
      expect(serverlessData).toEqual(expectedValue);
    });
  });
});
