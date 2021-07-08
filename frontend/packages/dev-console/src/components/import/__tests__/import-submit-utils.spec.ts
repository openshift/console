import * as _ from 'lodash';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
  BuildConfigModel,
  SecretModel,
} from '@console/internal/models';
import * as k8s from '@console/internal/module/k8s';
import * as pipelineUtils from '@console/pipelines-plugin/src/components/import/pipeline/pipeline-template-utils';
import * as pipelineOverviewUtils from '@console/pipelines-plugin/src/components/pipelines/pipeline-overview/pipeline-overview-utils';
import { PipelineModel } from '@console/pipelines-plugin/src/models';
import * as submitUtils from '../import-submit-utils';
import { Resources } from '../import-types';
import {
  defaultData,
  nodeJsBuilderImage as buildImage,
  sampleDevfileFormData,
} from './import-submit-utils-data';

const { createOrUpdateDeployment, createOrUpdateResources, createDevfileResources } = submitUtils;

describe('Import Submit Utils', () => {
  const t = jest.fn();

  describe('createDeployment tests', () => {
    beforeAll(() => {
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should set annotations for triggers while creating deployment', async (done) => {
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
          pause: 'false',
        },
      ]);
      done();
    });

    it('should assign limits on creating Deployment', async (done) => {
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
      done();
    });
  });

  describe('createResource tests', () => {
    beforeAll(() => {
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call createDeployment when resource is Kubernetes', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;

      const returnValue = await createOrUpdateResources(t, mockData, buildImage.obj, false);
      expect(returnValue).toHaveLength(7);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([
        ImageStreamModel.kind,
        BuildConfigModel.kind,
        SecretModel.kind,
        DeploymentModel.kind,
        ServiceModel.kind,
        RouteModel.kind,
        SecretModel.kind,
      ]);
      done();
    });

    it('should not createDeploymentConfig when resource is OpenShift', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.OpenShift;

      const returnValue = await createOrUpdateResources(t, mockData, buildImage.obj, false);
      expect(returnValue).toHaveLength(7);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([
        ImageStreamModel.kind,
        BuildConfigModel.kind,
        SecretModel.kind,
        DeploymentConfigModel.kind,
        ServiceModel.kind,
        RouteModel.kind,
        SecretModel.kind,
      ]);
      done();
    });

    it('should call KNative when creating Resources when resource is KNative', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.KnativeService;

      const imageStreamSpy = jest
        .spyOn(submitUtils, 'createOrUpdateImageStream')
        .mockImplementation(() => ({
          status: {
            dockerImageReference: 'test:1234',
          },
        }));

      const returnValue = await createOrUpdateResources(t, mockData, buildImage.obj, false);
      // createImageStream is called as separate entity
      expect(imageStreamSpy).toHaveBeenCalled();
      expect(returnValue).toHaveLength(1);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([ServiceModel.kind]);
      done();
    });
  });

  describe('createPipelineResource tests', () => {
    beforeEach(() => {
      jest.spyOn(k8s, 'k8sCreate').mockImplementation((model, data) => Promise.resolve(data));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create pipeline resource if pipeline is enabled and template is present', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;

      const createPipelineResourceSpy = jest
        .spyOn(pipelineUtils, 'createPipelineForImportFlow')
        .mockImplementation((name, namespace) => {
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
      const createPipelineRunResourceSpy = jest
        .spyOn(pipelineUtils, 'createPipelineRunForImportFlow')
        .mockImplementation(jest.fn()); // can't handle a no-arg spyOn invoke, stub

      await createOrUpdateResources(t, mockData, buildImage.obj, false, false, 'create');
      expect(createPipelineResourceSpy).toHaveBeenCalledWith(
        mockData.name,
        mockData.project.name,
        mockData.git.url,
        mockData.git.ref,
        mockData.git.dir,
        mockData.pipeline,
        mockData.docker.dockerfilePath,
        mockData.image.tag,
      );
      expect(createPipelineRunResourceSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it('should create pipeline resource with same name as application name', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;

      const createPipelineResourceSpy = jest.spyOn(pipelineUtils, 'createPipelineForImportFlow');

      const returnValue = await createOrUpdateResources(
        t,
        mockData,
        buildImage.obj,
        false,
        false,
        'create',
      );

      expect(createPipelineResourceSpy).toHaveBeenCalledWith(
        mockData.name,
        mockData.project.name,
        mockData.git.url,
        mockData.git.ref,
        mockData.git.dir,
        mockData.pipeline,
        mockData.docker.dockerfilePath,
        mockData.image.tag,
      );
      const pipelineRunResource = returnValue[1];
      expect(pipelineRunResource.metadata.name.includes(mockData.name)).toEqual(true);
      done();
    });

    it('should suppress the error if the pipelinerun creation fails with the error', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;
      mockData.pipeline.enabled = true;

      // Suppress the console log for a cleaner test
      jest.spyOn(console, 'log').mockImplementation(jest.fn());

      // Force an exception
      jest
        .spyOn(pipelineUtils, 'createPipelineRunForImportFlow')
        .mockImplementation(() =>
          Promise.reject(new Error('PipelineRun errored out and was not caught')),
        );

      // Make sure the fallback is called
      const setPipelineNotStartedSpy = jest.spyOn(pipelineOverviewUtils, 'setPipelineNotStarted');

      const returnValue = await createOrUpdateResources(
        t,
        mockData,
        buildImage.obj,
        false,
        false,
        'create',
      );
      expect(setPipelineNotStartedSpy).toHaveBeenCalled();
      expect(returnValue).toHaveLength(6);

      // re-enable logs for future tests
      // eslint-disable-next-line no-console
      (console.log as any).mockRestore();

      done();
    });

    it('should throw error if the deployment creation fails with the error', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;
      mockData.pipeline.enabled = true;
      jest
        .spyOn(submitUtils, 'createOrUpdateDeployment')
        .mockImplementation(() => Promise.reject(new Error('Deployment')));

      await expect(
        createOrUpdateResources(t, mockData, buildImage.obj, false, false, 'create'),
      ).rejects.toEqual(new Error('Deployment'));
      done();
    });

    it('should not create pipeline resource if pipeline is not enabled', async (done) => {
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
      done();
    });

    it('should add pipeline annotations to secret if present and update service account', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;
      mockData.git.secret = 'sample-secret';

      const k8sUpdateMock = jest
        .spyOn(k8s, 'k8sUpdate')
        .mockImplementation((_model, data) => Promise.resolve(data));
      const k8sGetMock = jest.spyOn(k8s, 'k8sGet').mockImplementation((model) => {
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

      done();
    });
  });

  describe('createDevfileResources', () => {
    beforeAll(() => {
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
    });

    afterAll(() => {
      jest.restoreAllMocks();
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
              '[{"from":{"kind":"ImageStreamTag","name":"devfile-sample:latest","namespace":"gijohn"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"devfile-sample\\")].image","pause":"false"}]',
            isFromDevfile: 'true',
            'openshift.io/generated-by': 'OpenShiftWebConsole',
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
                deploymentconfig: 'devfile-sample',
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
});
