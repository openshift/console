import * as _ from 'lodash';
import * as k8s from '@console/internal/module/k8s';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
  BuildConfigModel,
  SecretModel,
} from '@console/internal/models';
import { Resources } from '../import-types';
import * as submitUtils from '../import-submit-utils';
import * as pipelineUtils from '../pipeline/pipeline-template-utils';
import { defaultData, nodeJsBuilderImage as buildImage } from './import-submit-utils-data';
import { PipelineModel } from '../../../models';

const { createOrUpdateDeployment, createOrUpdateResources } = submitUtils;

describe('Import Submit Utils', () => {
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
          from: { kind: 'ImageStreamTag', name: 'nodejs-ex-git:latest', namespace: 'gijohn' },
          fieldPath: 'spec.template.spec.containers[?(@.name=="nodejs-ex-git")].image',
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

      const returnValue = await createOrUpdateResources(mockData, buildImage.obj, false);
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

      const returnValue = await createOrUpdateResources(mockData, buildImage.obj, false);
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

      const returnValue = await createOrUpdateResources(mockData, buildImage.obj, false);
      // createImageStream is called as separate entity
      expect(imageStreamSpy).toHaveBeenCalled();
      expect(returnValue).toHaveLength(1);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([ServiceModel.kind]);
      done();
    });
  });

  describe('createPipelineResource tests', () => {
    beforeAll(() => {
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should create pipeline resource if pipeline is enabled and template is present', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;

      const createPipelineResourceSpy = jest.spyOn(pipelineUtils, 'createPipelineForImportFlow');

      const returnValue = await createOrUpdateResources(
        mockData,
        buildImage.obj,
        false,
        false,
        'create',
      );
      expect(createPipelineResourceSpy).toHaveBeenCalledWith(mockData);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models.includes(PipelineModel.kind)).toEqual(true);
      done();
    });

    it('should create pipeline resource with same name as application name', async (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.pipeline.enabled = true;

      const createPipelineResourceSpy = jest.spyOn(pipelineUtils, 'createPipelineForImportFlow');

      const returnValue = await createOrUpdateResources(
        mockData,
        buildImage.obj,
        false,
        false,
        'create',
      );

      expect(createPipelineResourceSpy).toHaveBeenCalledWith(mockData);
      const pipelineResource = returnValue[6].data;
      expect(pipelineResource.metadata.name).toEqual(mockData.name);
      done();
    });

    it('should not create pipeline resource if pipeline is not enabled', async (done) => {
      const mockData = _.cloneDeep(defaultData);

      const returnValue = await createOrUpdateResources(
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
  });
});
