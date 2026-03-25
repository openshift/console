import * as _ from 'lodash';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
  BuildConfigModel,
  SecretModel,
} from '@console/internal/models';
import * as knativeUtils from '@console/knative-plugin/src/utils/create-knative-utils';
import { PipelineModel } from '../../../models/pipelines';
import * as pipelineUtils from '../../pipeline-section/pipeline/pipeline-template-utils';
import * as submitUtils from '../import-submit-utils';
import { Resources } from '../import-types';
import {
  defaultData,
  devfileImportData,
  ghImportDefaultData,
  ghImportTelData,
  nodeJsBuilderImage as buildImage,
  sampleClusterTriggerBinding,
  sampleDevfileFormData,
} from './import-submit-utils-data';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sCreate: jest.fn(),
  k8sGet: jest.fn(),
  k8sUpdate: jest.fn(),
}));

jest.mock('@console/knative-plugin/src/utils/create-knative-utils', () => ({
  ...jest.requireActual('@console/knative-plugin/src/utils/create-knative-utils'),
  getDomainMappingRequests: jest.fn(),
  getKnativeServiceDepResource: jest.fn(),
}));

jest.mock('../../pipeline-section/pipeline/pipeline-template-utils', () => ({
  ...jest.requireActual('../../pipeline-section/pipeline/pipeline-template-utils'),
  submitTrigger: jest.fn(),
  createTrigger: jest.fn(),
  createPipelineForImportFlow: jest.fn(),
  createPipelineRunForImportFlow: jest.fn(),
  setPipelineNotStarted: jest.fn(),
}));

jest.mock('../import-submit-utils', () => ({
  ...jest.requireActual('../import-submit-utils'),
  createOrUpdateImageStream: jest.fn(),
}));

const k8sCreateMock = k8sResourceModule.k8sCreate as jest.Mock;
const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;
const k8sUpdateMock = k8sResourceModule.k8sUpdate as jest.Mock;
const getDomainMappingRequestsMock = knativeUtils.getDomainMappingRequests as jest.Mock;
const getKnativeServiceDepResourceMock = knativeUtils.getKnativeServiceDepResource as jest.Mock;
const submitTriggerMock = pipelineUtils.submitTrigger as jest.Mock;
const createTriggerMock = pipelineUtils.createTrigger as jest.Mock;
const createPipelineForImportFlowMock = pipelineUtils.createPipelineForImportFlow as jest.Mock;
const createPipelineRunForImportFlowMock = pipelineUtils.createPipelineRunForImportFlow as jest.Mock;
const setPipelineNotStartedMock = pipelineUtils.setPipelineNotStarted as jest.Mock;
const createOrUpdateImageStreamMock = submitUtils.createOrUpdateImageStream as jest.Mock;

const {
  createOrUpdateDeployment,
  createOrUpdateResources,
  createDevfileResources,
  addSearchParamsToRelativeURL,
} = submitUtils;

describe('Import Submit Utils', () => {
  const mockFn = jest.fn();
  const t = mockFn;

  describe('createDeployment tests', () => {
    beforeAll(() => {
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({ model, data, dryRun }),
      );
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should set annotations for triggers while creating deployment', async () => {
      const returnValue = await createOrUpdateDeployment(defaultData, buildImage.obj, false);
      const annotations = _.get(returnValue, 'data.metadata.annotations');
      expect(JSON.parse(annotations['image.openshift.io/triggers'])).toEqual([
        {
          from: {
            kind: 'ImageStreamTag',
            name: 'nodejs-ex-git:latest',
            namespace: 'gijohn',
          },
          fieldPath: 'spec.template.spec.containers[?(@.name=="nodejs-ex-git")].image',
          paused: false,
        },
      ]);
    });

    it('should assign limits on creating Deployment', async () => {
      const data = _.cloneDeep(defaultData);
      data.limits = {
        cpu: {
          request: 5,
          requestUnit: 'm',
          defaultRequestUnit: 'm',
          limit: 10,
          limitUnit: 'm',
          defaultLimitUnit: 'm',
        },
        memory: {
          request: 100,
          requestUnit: 'Mi',
          defaultRequestUnit: 'Mi',
          limit: 200,
          limitUnit: 'Mi',
          defaultLimitUnit: 'Mi',
        },
      };

      const returnValue = await createOrUpdateDeployment(data, buildImage.obj, false);
      expect(_.get(returnValue, 'data.spec.template.spec.containers[0].resources')).toEqual({
        limits: { cpu: '10m', memory: '200Mi' },
        requests: { cpu: '5m', memory: '100Mi' },
      });
    });
  });

  describe('createResource tests', () => {
    beforeAll(() => {
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({ model, data, dryRun }),
      );
      createOrUpdateImageStreamMock.mockImplementation(() =>
        Promise.resolve({ model: ImageStreamModel, data: {}, dryRun: false }),
      );
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should call createDeployment when resource is Kubernetes', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;

      const returnValue = await createOrUpdateResources(t, mockData, buildImage.obj, false);
      expect(returnValue).toHaveLength(7);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([
        ImageStreamModel.kind,
        BuildConfigModel.kind,
        SecretModel.kind,
        SecretModel.kind,
        DeploymentModel.kind,
        ServiceModel.kind,
        RouteModel.kind,
      ]);
    });

    it('should not createDeploymentConfig when resource is OpenShift', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.OpenShift;

      const returnValue = await createOrUpdateResources(t, mockData, buildImage.obj, false);
      expect(returnValue).toHaveLength(7);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([
        ImageStreamModel.kind,
        BuildConfigModel.kind,
        SecretModel.kind,
        SecretModel.kind,
        DeploymentConfigModel.kind,
        ServiceModel.kind,
        RouteModel.kind,
      ]);
    });

    it('should call KNative when creating Resources when resource is KNative', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.KnativeService;

      k8sCreateMock.mockImplementation((model, data, dryRun) => {
        if (model.kind === ImageStreamModel.kind) {
          return Promise.resolve({
            model,
            data,
            dryRun,
            status: {
              dockerImageRepository: 'test:1234',
            },
          });
        }
        return Promise.resolve({ model, data, dryRun });
      });

      getDomainMappingRequestsMock.mockImplementation(() => []);
      getKnativeServiceDepResourceMock.mockImplementation(() => {});

      const returnValue = await createOrUpdateResources(t, mockData, buildImage.obj, false);
      expect(getKnativeServiceDepResourceMock).toHaveBeenCalled();
      expect(getDomainMappingRequestsMock).toHaveBeenCalled();
      expect(returnValue).toHaveLength(5);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([
        ServiceModel.kind,
        ImageStreamModel.kind,
        BuildConfigModel.kind,
        SecretModel.kind,
        SecretModel.kind,
      ]);
    });
  });

  describe('createPipelineResource tests', () => {
    beforeEach(() => {
      k8sCreateMock.mockImplementation((model, data) => Promise.resolve(data));
      k8sGetMock.mockReturnValue(Promise.resolve(sampleClusterTriggerBinding));
      submitTriggerMock.mockImplementation(jest.fn());
      createTriggerMock.mockImplementation(() => Promise.resolve([]));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create pipeline resources if pipeline is enabled and template is present', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;

      createPipelineForImportFlowMock.mockImplementation((name, namespace) => {
        return {
          metadata: {
            name,
            namespace,
            labels: { 'app.kubernetes.io/instance': name },
          },
          spec: {
            params: [],
            resources: [],
            tasks: [],
          },
        };
      });
      createPipelineRunForImportFlowMock.mockImplementation(jest.fn()); // can't handle a no-arg spyOn invoke, stub
      createTriggerMock.mockImplementation(() => Promise.resolve([]));

      await createOrUpdateResources(t, mockData, buildImage.obj, false, false, 'create');
      expect(createPipelineForImportFlowMock).toHaveBeenCalledWith(
        mockData.name,
        mockData.project.name,
        mockData.git.url,
        mockData.git.ref,
        mockData.git.dir,
        mockData.pipeline,
        mockData.docker.dockerfilePath,
        mockData.image.tag,
        mockData.build.env,
        {},
      );
      expect(createPipelineRunForImportFlowMock).toHaveBeenCalledTimes(1);
      expect(createTriggerMock).toHaveBeenCalledTimes(1);
    });

    it('should create pipeline resource with same name as application name', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;

      const returnValue = await createOrUpdateResources(
        t,
        mockData,
        buildImage.obj,
        false,
        false,
        'create',
      );

      expect(createPipelineForImportFlowMock).toHaveBeenCalledWith(
        mockData.name,
        mockData.project.name,
        mockData.git.url,
        mockData.git.ref,
        mockData.git.dir,
        mockData.pipeline,
        mockData.docker.dockerfilePath,
        mockData.image.tag,
        mockData.build.env,
        {},
      );
      const pipelineRunResource = returnValue[1];
      expect(pipelineRunResource.metadata.name.includes(mockData.name)).toEqual(true);
    });

    it('should suppress the error if the trigger creation fails with the error', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;
      mockData.pipeline.enabled = true;

      // Suppress the console log for a cleaner test
      const errorLogger = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

      // Force an exception
      createTriggerMock.mockImplementation(() =>
        Promise.reject(new Error('Webhook trigger errored out and was not caught')),
      );

      await createOrUpdateResources(t, mockData, buildImage.obj, false, false, 'create');
      expect(errorLogger).toHaveBeenCalled();

      // re-enable logs for future tests
      // eslint-disable-next-line no-console
      (console.warn as any).mockRestore();
    });

    it('should suppress the error if the pipelinerun creation fails with the error', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;
      mockData.pipeline.enabled = true;

      // Suppress the console log for a cleaner test
      jest.spyOn(console, 'log').mockImplementation(jest.fn());

      // Force an exception
      createPipelineRunForImportFlowMock.mockImplementation(() =>
        Promise.reject(new Error('PipelineRun errored out and was not caught')),
      );

      const returnValue = await createOrUpdateResources(
        t,
        mockData,
        buildImage.obj,
        false,
        false,
        'create',
      );
      expect(setPipelineNotStartedMock).toHaveBeenCalled();
      expect(returnValue).toHaveLength(7);

      // re-enable logs for future tests
      // eslint-disable-next-line no-console
      (console.log as any).mockRestore();
    });

    it('should throw error if the deployment creation fails with the error', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;
      mockData.pipeline.enabled = true;
      k8sCreateMock.mockImplementation((model) => {
        if (model.kind === DeploymentModel.kind) {
          return Promise.reject(new Error('Deployment'));
        }
        return Promise.resolve({ model });
      });

      await expect(
        createOrUpdateResources(t, mockData, buildImage.obj, false, false, 'create'),
      ).rejects.toEqual(new Error('Deployment'));
    });

    it('should not create pipeline resource if pipeline is not enabled', async () => {
      const mockData = _.cloneDeep(defaultData);

      const returnValue = await createOrUpdateResources(
        t,
        mockData,
        buildImage.obj,
        false,
        false,
        'create',
      );
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models.includes(PipelineModel.kind)).toEqual(false);
    });

    it('should add pipeline annotations to secret if present and update service account', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;
      mockData.git.secret = 'sample-secret';

      k8sUpdateMock.mockImplementation((_model, data) => Promise.resolve(data));
      k8sGetMock.mockImplementation((model) => {
        if (model.kind === 'Secret') {
          return Promise.resolve({ metadata: { annotations: {} } });
        }
        if (model.kind === 'ServiceAccount') {
          return Promise.resolve({ secrets: [] });
        }
        return Promise.resolve({});
      });

      await createOrUpdateResources(t, mockData, buildImage.obj, false, false, 'create');
      expect(k8sGetMock).toHaveBeenCalledWith(
        expect.anything(),
        'sample-secret',
        expect.anything(),
      );
      expect(k8sUpdateMock).toHaveBeenCalledWith(
        expect.anything(),
        { metadata: { annotations: { 'tekton.dev/git-0': 'https://github.com' } } },
        expect.anything(),
      );

      mockData.git.url = 'git@github.com:sclorg/nodejs-ex.git';
      await createOrUpdateResources(t, mockData, buildImage.obj, false, false, 'create');
      expect(k8sUpdateMock).toHaveBeenCalledWith(
        expect.anything(),
        { metadata: { annotations: { 'tekton.dev/git-0': 'github.com' } } },
        expect.anything(),
      );
    });
  });

  describe('createDevfileResources', () => {
    beforeAll(() => {
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({ model, data, dryRun }),
      );
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('return a Deployment with just one container which includes ports, env from Devfile container ', async () => {
      const formData = sampleDevfileFormData;
      const returnValue = await createDevfileResources(formData, false, {}, '');

      const deployment = returnValue.find((resource) => resource.data.kind === 'Deployment').data;

      expect(deployment).toEqual({
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          annotations: {
            'alpha.image.policy.openshift.io/resolve-names': '*',
            'app.openshift.io/vcs-ref': 'master',
            'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/devfile-sample',
            'image.openshift.io/triggers':
              '[{"from":{"kind":"ImageStreamTag","name":"devfile-sample:latest","namespace":"gijohn"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"devfile-sample\\")].image","paused":false}]',
            isFromDevfile: 'true',
            'openshift.io/generated-by': 'OpenShiftWebConsole',
            'app.openshift.io/route-disabled': 'false',
          },
          creationTimestamp: null,
          labels: {
            app: 'devfile-sample',
            'app.kubernetes.io/component': 'devfile-sample',
            'app.kubernetes.io/instance': 'devfile-sample',
            'app.kubernetes.io/name': 'devfile-sample',
            'app.kubernetes.io/part-of': 'devfile-sample-app',
            'app.openshift.io/runtime': 'devfile-sample',
          },
          name: 'devfile-sample',
          namespace: 'gijohn',
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: 'devfile-sample',
            },
          },
          strategy: {
            type: 'Recreate',
          },
          template: {
            metadata: {
              creationTimestamp: null,
              labels: {
                app: 'devfile-sample',
                deployment: 'devfile-sample',
              },
            },
            spec: {
              containers: [
                {
                  env: [
                    {
                      name: 'PROJECTS_ROOT',
                      value: '/projects',
                    },
                    {
                      name: 'PROJECT_SOURCE',
                      value: '/projects',
                    },
                  ],
                  image: 'devfile-sample:latest',
                  name: 'devfile-sample',
                  ports: [
                    {
                      protocol: 'TCP',
                      containerPort: 3001,
                      name: 'http-3001',
                    },
                  ],
                  resources: {
                    limits: {
                      memory: '1Gi',
                    },
                  },
                },
              ],
            },
          },
        },
        status: {},
      });
    });
  });

  describe('get git import telemetry data', () => {
    it('getTelemetryImport should return appropriate data if no advanced options are used', () => {
      const telGHData = submitUtils.getTelemetryImport(ghImportDefaultData);
      expect(telGHData).toEqual(ghImportTelData);
    });

    it('isResourceLimitAdvOptions should return false if resource limit options are not used', () => {
      const telGhResLimit = submitUtils.isResourceLimitAdvOptions(ghImportDefaultData.limits);
      expect(telGhResLimit).toEqual(false);
    });

    it('isScalingAdvOptions should return false if scaling options are not used', () => {
      const telGhScalingData = submitUtils.isScalingAdvOptions(
        ghImportDefaultData.resources,
        ghImportDefaultData.deployment,
        ghImportDefaultData.serverless,
      );
      expect(telGhScalingData).toEqual(false);
    });

    it('isRouteAdvOptionsUsed should return false if route options are not used', () => {
      const telGhRouteData = submitUtils.isRouteAdvOptionsUsed(
        ghImportDefaultData.resources,
        ghImportDefaultData.route,
        ghImportDefaultData.serverless,
      );
      expect(telGhRouteData).toEqual(false);
    });

    it('getTelemetryImport should return appropriate data with useAdvancedOptionsRoute option as true if route advanced options are used', () => {
      const ghImportAdvData = {
        ...ghImportDefaultData,
        route: {
          ...ghImportDefaultData.route,
          path: 'domain.org',
        },
      };
      const telGHData = submitUtils.getTelemetryImport(ghImportAdvData);
      expect(telGHData).toEqual({ ...ghImportTelData, useAdvancedOptionsRoute: true });

      const telGhRouteData = submitUtils.isRouteAdvOptionsUsed(
        ghImportAdvData.resources,
        ghImportAdvData.route,
        ghImportAdvData.serverless,
      );

      expect(telGhRouteData).toEqual(true);
    });

    it('getTelemetryImport should return appropriate data with useAdvancedOptionsScaling option as true if scaling advanced options are used', () => {
      const ghImportAdvData = {
        ...ghImportDefaultData,
        deployment: {
          ...ghImportDefaultData.deployment,
          replicas: 2,
        },
      };
      const telGHData = submitUtils.getTelemetryImport(ghImportAdvData);
      expect(telGHData).toEqual({ ...ghImportTelData, useAdvancedOptionsScaling: true });

      const telGhScalingData = submitUtils.isScalingAdvOptions(
        ghImportAdvData.resources,
        ghImportAdvData.deployment,
        ghImportAdvData.serverless,
      );

      expect(telGhScalingData).toEqual(true);
    });

    it('getTelemetryImport should return appropriate data with useAdvancedOptionsScaling option as true if scaling advanced options are used for Serverless', () => {
      const ghImportAdvData = {
        ...ghImportDefaultData,
        resources: Resources.KnativeService,
        serverless: {
          ...ghImportDefaultData.serverless,
          scaling: {
            ...ghImportDefaultData.serverless.scaling,
            concurrencytarget: 102,
          },
        },
      };
      const telGHData = submitUtils.getTelemetryImport(ghImportAdvData);
      expect(telGHData).toEqual({
        ...ghImportTelData,
        resource: 'Knative Service',
        useAdvancedOptionsScaling: true,
      });

      const telGhScalingData = submitUtils.isScalingAdvOptions(
        ghImportAdvData.resources,
        ghImportAdvData.deployment,
        ghImportAdvData.serverless,
      );

      expect(telGhScalingData).toEqual(true);
    });

    it('getTelemetryImport should return appropriate data with useAdvancedOptionsRoute option as true if route advanced options are used', () => {
      const ghImportAdvData = {
        ...ghImportDefaultData,
        route: {
          ...ghImportDefaultData.route,
          hostname: 'domain.org',
        },
      };
      const telGHData = submitUtils.getTelemetryImport(ghImportAdvData);
      expect(telGHData).toEqual({ ...ghImportTelData, useAdvancedOptionsRoute: true });

      const telGhScalingData = submitUtils.isRouteAdvOptionsUsed(
        ghImportAdvData.resources,
        ghImportAdvData.route,
        ghImportAdvData.serverless,
      );

      expect(telGhScalingData).toEqual(true);
    });

    it('getTelemetryImport should return appropriate data with useAdvancedOptionsRoute option as true if route advanced options are used for Serverless', () => {
      const ghImportAdvData = {
        ...ghImportDefaultData,
        resources: Resources.KnativeService,
        serverless: {
          ...ghImportDefaultData.serverless,
          domainMapping: ['domain.org'],
        },
      };
      const telGHData = submitUtils.getTelemetryImport(ghImportAdvData);
      expect(telGHData).toEqual({
        ...ghImportTelData,
        resource: 'Knative Service',
        useAdvancedOptionsRoute: true,
      });

      const telGhScalingData = submitUtils.isRouteAdvOptionsUsed(
        ghImportAdvData.resources,
        ghImportAdvData.route,
        ghImportAdvData.serverless,
      );

      expect(telGhScalingData).toEqual(true);
    });

    it('getTelemetryImport should return appropriate data for devfile', () => {
      const ghImportdevfileData = {
        ...ghImportDefaultData,
        devfile: devfileImportData,
      };
      const telGHData = submitUtils.getTelemetryImport(ghImportdevfileData);
      expect(telGHData).toEqual({
        ...ghImportTelData,
        devFileLanguage: 'python',
        devFileProjectType: 'python',
      });
    });
  });

  describe('addSearchParamsToRelativeURL tests', () => {
    it('should work when the URL already has a search param', () => {
      expect(
        addSearchParamsToRelativeURL(
          '/foo/bar?param=true',
          new URLSearchParams({ newParam: 'new' }),
        ),
      ).toEqual('/foo/bar?param=true&newParam=new');
    });

    it('should override existing search params', () => {
      expect(
        addSearchParamsToRelativeURL(
          '/foo/bar?param=true',
          new URLSearchParams({ param: 'false' }),
        ),
      ).toEqual('/foo/bar?param=false');
    });

    it('should work when there is a section in the URL', () => {
      expect(
        addSearchParamsToRelativeURL('/foo/bar#section', new URLSearchParams({ param: 'true' })),
      ).toEqual('/foo/bar?param=true#section');
    });

    it('should work when the URL has no search params', () => {
      expect(
        addSearchParamsToRelativeURL('/foo/bar', new URLSearchParams({ param: 'true' })),
      ).toEqual('/foo/bar?param=true');
    });

    it('should override search params, work when there are sections', () => {
      expect(
        addSearchParamsToRelativeURL(
          '/foo/bar?param=true#section',
          new URLSearchParams({ param: 'false' }),
        ),
      ).toEqual('/foo/bar?param=false#section');
    });
  });
});
