import * as _ from 'lodash';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ServiceModel,
  ImageStreamModel,
  RouteModel,
  BuildConfigModel,
  SecretModel,
} from '@console/internal/models';
import * as k8s from '@console/internal/module/k8s';
import { uploadJarMockFormData } from '../__mocks__/upload-jar-mock';
import * as importSubmitUtils from '../import-submit-utils';
import { Resources } from '../import-types';
import * as submitUtils from '../upload-jar-submit-utils';
import { nodeJsBuilderImage as buildImage } from './import-submit-utils-data';

const { createOrUpdateDeployment, createOrUpdateJarFile } = submitUtils;

describe('Upload Jar Submit Utils', () => {
  describe('create Deployment tests', () => {
    beforeAll(() => {
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should set annotations for triggers while creating deployment', async (done) => {
      const returnValue = await createOrUpdateDeployment(
        uploadJarMockFormData,
        buildImage.obj,
        false,
      );
      const annotations = _.get(returnValue, 'data.metadata.annotations');
      expect(JSON.parse(annotations['image.openshift.io/triggers'])).toEqual([
        {
          from: {
            kind: 'ImageStreamTag',
            name: 'java-ex-git:latest',
            namespace: 'my-app',
          },
          fieldPath: 'spec.template.spec.containers[?(@.name=="java-ex-git")].image',
          pause: 'false',
        },
      ]);
      done();
    });

    it('should assign limits on creating Deployment', async (done) => {
      const data = _.cloneDeep(uploadJarMockFormData);
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

  describe('create Resource tests', () => {
    beforeAll(() => {
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
      jest.spyOn(submitUtils, 'instantiateBinaryBuild').mockImplementation(() => ({}));
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call createDeployment when resource is Kubernetes', async (done) => {
      const mockData = _.cloneDeep(uploadJarMockFormData);
      mockData.resources = Resources.Kubernetes;

      const returnValue = await createOrUpdateJarFile(mockData, buildImage.obj, false);
      expect(returnValue).toHaveLength(6);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([
        ImageStreamModel.kind,
        BuildConfigModel.kind,
        SecretModel.kind,
        DeploymentModel.kind,
        ServiceModel.kind,
        RouteModel.kind,
      ]);
      done();
    });

    it('should call createDeploymentConfig when resource is OpenShift', async (done) => {
      const mockData = _.cloneDeep(uploadJarMockFormData);
      mockData.resources = Resources.OpenShift;

      const returnValue = await createOrUpdateJarFile(mockData, buildImage.obj, false);
      expect(returnValue).toHaveLength(6);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([
        ImageStreamModel.kind,
        BuildConfigModel.kind,
        SecretModel.kind,
        DeploymentConfigModel.kind,
        ServiceModel.kind,
        RouteModel.kind,
      ]);
      done();
    });

    it('should call Knative when creating Resources when resource is Knative', async (done) => {
      const mockData = _.cloneDeep(uploadJarMockFormData);
      mockData.resources = Resources.KnativeService;
      const imageStreamSpy = jest
        .spyOn(importSubmitUtils, 'createOrUpdateImageStream')
        .mockImplementation(() => ({
          apiVersion: 'image.openshift.io/v1',
          kind: 'ImageStream',
          metadata: {
            name: 'test',
          },
          status: {
            dockerImageReference: 'test:1234',
          },
        }));

      const returnValue = await createOrUpdateJarFile(mockData, buildImage.obj, false);
      expect(imageStreamSpy).toHaveBeenCalled();
      expect(returnValue).toHaveLength(4);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toContain(BuildConfigModel.kind);
      done();
    });
  });
});
