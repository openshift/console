import * as _ from 'lodash';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ServiceModel,
  ImageStreamModel,
  RouteModel,
  BuildConfigModel,
  SecretModel,
} from '@console/internal/models';
import { uploadJarMockFormData } from '../__mocks__/upload-jar-mock';
import * as importSubmitUtils from '../import-submit-utils';
import { Resources } from '../import-types';
import * as submitUtils from '../upload-jar-submit-utils';
import { nodeJsBuilderImage as buildImage } from './import-submit-utils-data';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sCreate: jest.fn(),
}));

jest.mock('../upload-jar-submit-utils', () => ({
  ...jest.requireActual('../upload-jar-submit-utils'),
  instantiateBinaryBuild: jest.fn(),
}));

jest.mock('../import-submit-utils', () => ({
  ...jest.requireActual('../import-submit-utils'),
  createOrUpdateImageStream: jest.fn(),
}));

const k8sCreateMock = k8sResourceModule.k8sCreate as jest.Mock;
const instantiateBinaryBuildMock = submitUtils.instantiateBinaryBuild as jest.Mock;
const createOrUpdateImageStreamMock = importSubmitUtils.createOrUpdateImageStream as jest.Mock;

const { createOrUpdateDeployment, createOrUpdateJarFile } = submitUtils;

describe('Upload Jar Submit Utils', () => {
  describe('create Deployment tests', () => {
    beforeAll(() => {
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({ model, data, dryRun }),
      );
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should set annotations for triggers while creating deployment', async () => {
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
          paused: false,
        },
      ]);
    });

    it('should assign limits on creating Deployment', async () => {
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
    });
  });

  describe('create Resource tests', () => {
    beforeAll(() => {
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({ model, data, dryRun }),
      );
      instantiateBinaryBuildMock.mockImplementation(() => ({}));
      createOrUpdateImageStreamMock.mockImplementation(() =>
        Promise.resolve({ model: ImageStreamModel, data: {}, dryRun: false }),
      );
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should call createDeployment when resource is Kubernetes', async () => {
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
    });

    it('should call createDeploymentConfig when resource is OpenShift', async () => {
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
    });

    it('should call Knative when creating Resources when resource is Knative', async () => {
      const mockData = _.cloneDeep(uploadJarMockFormData);
      mockData.resources = Resources.KnativeService;
      createOrUpdateImageStreamMock.mockImplementation(() => ({
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
      expect(createOrUpdateImageStreamMock).toHaveBeenCalled();
      expect(returnValue).toHaveLength(4);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toContain(BuildConfigModel.kind);
    });
  });
});
