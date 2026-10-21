import * as _ from 'lodash';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import * as k8sInternalResourceModule from '@console/internal/module/k8s/resource';
import { getSuggestedName } from '../../../utils/imagestream-utils';
import {
  mockDeployImageFormData,
  mockImageStreamData,
} from '../__mocks__/deployImage-validation-mock';
import * as submitUtils from '../deployImage-submit-utils';
import type { DeployImageFormData } from '../import-types';
import { Resources } from '../import-types';
import {
  dataWithoutPorts,
  dataWithPorts,
  dataWithTargetPort,
  defaultData,
  internalImageData,
} from './deployImage-submit-utils-data';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sCreate: jest.fn(),
  k8sUpdate: jest.fn(),
  k8sGet: jest.fn(),
}));

jest.mock('@console/internal/module/k8s/resource', () => ({
  ...jest.requireActual('@console/internal/module/k8s/resource'),
  k8sWaitForUpdate: jest.fn(),
}));

const k8sCreateMock = k8sResourceModule.k8sCreate as jest.Mock;
const k8sUpdateMock = k8sResourceModule.k8sUpdate as jest.Mock;
const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;
const k8sWaitForUpdateMock = k8sInternalResourceModule.k8sWaitForUpdate as jest.Mock;

const {
  ensurePortExists,
  createOrUpdateDeployment,
  createOrUpdateDeployImageResources,
} = submitUtils;

describe('DeployImage Submit Utils', () => {
  describe('Ensure Port Exists', () => {
    const DEFAULT_PORT = { containerPort: 8080, protocol: 'TCP' };
    const DEFAULT_REGISTRY = 'external';
    it('expect default / empty data to get the default port', () => {
      const values: DeployImageFormData = ensurePortExists(defaultData);
      expect(values.isi.ports).toHaveLength(1);
      expect(values.isi.ports).toContainEqual(DEFAULT_PORT);
    });

    it('expect default to be set as external registry', () => {
      const values: DeployImageFormData = ensurePortExists(defaultData);
      expect(values.registry).toEqual(DEFAULT_REGISTRY);
    });

    it('expect to get a suggested name from the docker path ', () => {
      const suggestedName: string = getSuggestedName(dataWithoutPorts.isi.name);
      expect(suggestedName).toEqual('helloworld-go');
    });

    it('expect image without port data to get the default port', () => {
      const values: DeployImageFormData = ensurePortExists(dataWithoutPorts);
      expect(values.isi.ports).toHaveLength(1);
      expect(values.isi.ports).toContainEqual(DEFAULT_PORT);
    });

    it('expect image without port data but provided custom port to use their custom port', () => {
      const values: DeployImageFormData = ensurePortExists(dataWithTargetPort);
      expect(values.isi.ports).toHaveLength(1);
      expect(values.isi.ports).toContainEqual({ containerPort: 6060, protocol: 'TCP' });
    });

    it('expect image with port data to use their port', () => {
      const values: DeployImageFormData = ensurePortExists(dataWithPorts);
      expect(values.isi.ports).toHaveLength(1);
      expect(values.isi.ports).toContainEqual({ containerPort: 8081, protocol: 'TCP' });
    });
  });

  describe('createOrUpdateImageStream', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      k8sCreateMock.mockResolvedValue(null);
      k8sUpdateMock.mockResolvedValue(null);
      k8sWaitForUpdateMock.mockResolvedValue(null);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should call only k8sCreate when call "dry-run create"', async () => {
      k8sCreateMock.mockResolvedValue(mockImageStreamData);

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        true,
        null,
        'create',
      );

      expect(k8sCreateMock).toHaveBeenCalledTimes(1);
      expect(k8sCreateMock).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData, {
        queryParams: { dryRun: 'All' },
      });
      expect(k8sUpdateMock).toHaveBeenCalledTimes(0);
      expect(k8sWaitForUpdateMock).toHaveBeenCalledTimes(0);
      expect(imageStream).toEqual(mockImageStreamData);
    });

    it('should call only k8sUpdate when call "dry-run update"', async () => {
      k8sUpdateMock.mockResolvedValue(mockImageStreamData);

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        true,
        mockImageStreamData,
        'update',
      );

      expect(k8sCreateMock).toHaveBeenCalledTimes(0);
      expect(k8sUpdateMock).toHaveBeenCalledTimes(1);
      expect(k8sUpdateMock).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData);
      expect(k8sWaitForUpdateMock).toHaveBeenCalledTimes(0);
      expect(imageStream).toEqual(mockImageStreamData);
    });

    it('should call k8sCreate and k8sWaitForUpdate when call "non-dry-run create"', async () => {
      k8sCreateMock.mockResolvedValue(mockImageStreamData);
      k8sWaitForUpdateMock.mockResolvedValue(mockImageStreamData);

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        false,
        null,
        'create',
      );

      expect(k8sCreateMock).toHaveBeenCalledTimes(1);
      expect(k8sCreateMock).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData, {});
      expect(k8sUpdateMock).toHaveBeenCalledTimes(0);
      expect(k8sWaitForUpdateMock).toHaveBeenCalledTimes(1);
      expect(k8sWaitForUpdateMock).toHaveBeenCalledWith(
        ImageStreamModel,
        mockImageStreamData,
        expect.any(Function),
        expect.any(Number),
      );
      expect(imageStream).toEqual(mockImageStreamData);
    });

    it('should call only k8sUpdate when call "non-dry-run update"', async () => {
      k8sUpdateMock.mockResolvedValue(mockImageStreamData);

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        false,
        mockImageStreamData,
        'update',
      );

      expect(k8sCreateMock).toHaveBeenCalledTimes(0);
      expect(k8sUpdateMock).toHaveBeenCalledTimes(1);
      expect(k8sUpdateMock).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData);
      expect(imageStream).toEqual(mockImageStreamData);
    });
  });

  describe('createDeployment tests', () => {
    beforeAll(() => {
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({ model, data, dryRun }),
      );
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should choose image from dockerImageReference when creating Deployment using internal imagestream', (done) => {
      createOrUpdateDeployment(internalImageData, false)
        .then((returnValue) => {
          expect(_.get(returnValue, 'model.kind')).toEqual(DeploymentModel.kind);
          expect(_.get(returnValue, 'data.spec.template.spec.containers[0].image')).toEqual(
            'image-registry.openshift-image-registry.svc:5000/gijohn/react-web-app@sha256:22319276ebe1b647149d5d95e1bef4252c274238e5634d54b7ce7bd17bcbcf14',
          );
          done();
        })
        .catch(() => {
          done();
        });
    });

    it('should create deployment with the internal imagestream labels instead of creating new imagestream name', (done) => {
      const internalImageStreamData = _.merge(_.cloneDeep(internalImageData), {
        isi: {
          image: {
            metadata: {
              labels: {
                'app.kubernetes.io/name': 'nodejs',
                'app.openshift.io/runtime': 'nodejs',
                'app.openshift.io/runtime-version': '10-SCL',
              },
            },
          },
        },
      });

      createOrUpdateDeployment(internalImageStreamData, false)
        .then((returnValue) => {
          const { data: Deployment } = returnValue;
          expect(Deployment.metadata.labels.app).toEqual('react-web-app');
          expect(Deployment.metadata.labels['app.kubernetes.io/name']).toEqual('nodejs');
          expect(Deployment.metadata.labels['app.kubernetes.io/runtime']).toEqual('nodejs');
          expect(Deployment.metadata.labels['app.kubernetes.io/runtime-version']).toEqual('10-SCL');
          done();
        })
        .catch(() => {
          done();
        });
    });

    it('should not have the internal imagestream labels', (done) => {
      createOrUpdateDeployment(internalImageData, false)
        .then((returnValue) => {
          const { data: Deployment } = returnValue;
          expect(Deployment.metadata.labels.app).toEqual('react-web-app');
          expect(Deployment.metadata.labels['app.kubernetes.io/name']).toBeUndefined();
          expect(Deployment.metadata.labels['app.kubernetes.io/runtime']).toBeUndefined();
          expect(Deployment.metadata.labels['app.kubernetes.io/runtime-version']).toBeUndefined();
          done();
        })
        .catch(() => {
          done();
        });
    });

    it('should assign limits on creating Deployment', (done) => {
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

      createOrUpdateDeployment(data, false)
        .then((returnValue) => {
          expect(_.get(returnValue, 'data.spec.template.spec.containers[0].resources')).toEqual({
            limits: { cpu: '10m', memory: '200Mi' },
            requests: { cpu: '5m', memory: '100Mi' },
          });
          done();
        })
        .catch(() => {
          done();
        });
    });
  });

  describe('createResource tests', () => {
    beforeAll(() => {
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({ model, data, dryRun }),
      );
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should call createImageStream when creating Resources using external image', (done) => {
      createOrUpdateDeployImageResources(defaultData, false)
        .then((returnValue) => {
          expect(returnValue).toHaveLength(4);
          const models = returnValue.map((data) => _.get(data, 'model.kind'));
          expect(models).toEqual([
            ImageStreamModel.kind,
            DeploymentConfigModel.kind,
            ServiceModel.kind,
            RouteModel.kind,
          ]);
          done();
        })
        .catch(() => {
          done();
        });
    });

    it('should not call createImageStream when creating Resources using internal imagestream', (done) => {
      createOrUpdateDeployImageResources(internalImageData, false)
        .then((returnValue) => {
          expect(returnValue).toHaveLength(3);
          const models = returnValue.map((data) => _.get(data, 'model.kind'));
          expect(models).toEqual([DeploymentModel.kind, ServiceModel.kind, RouteModel.kind]);
          done();
        })
        .catch(() => {
          done();
        });
    });

    it('should call KNative when creating Resources when resource is KNative', async () => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.KnativeService;

      // Mock k8sCreate to return imagestream with dockerImageRepository
      k8sCreateMock.mockImplementation((model, data, dryRun) =>
        Promise.resolve({
          model,
          data,
          dryRun,
          status: {
            dockerImageRepository: 'test:1234',
          },
        }),
      );
      k8sWaitForUpdateMock.mockResolvedValue({
        status: {
          dockerImageRepository: 'test:1234',
        },
      });
      // Mock k8sGet for domain mapping lookup
      k8sGetMock.mockResolvedValue({ items: [] });

      const returnValue = await createOrUpdateDeployImageResources(mockData, false);
      expect(returnValue).toHaveLength(1);
      const models = returnValue.map((data) => _.get(data, 'model.kind'));
      expect(models).toEqual([ServiceModel.kind]);
    });
  });
});
