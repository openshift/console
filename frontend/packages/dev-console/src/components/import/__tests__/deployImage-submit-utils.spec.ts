import * as _ from 'lodash';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import * as k8s from '@console/internal/module/k8s';
import { getSuggestedName } from '../../../utils/imagestream-utils';
import {
  mockDeployImageFormData,
  mockImageStreamData,
} from '../__mocks__/deployImage-validation-mock';
import * as submitUtils from '../deployImage-submit-utils';
import { DeployImageFormData, Resources } from '../import-types';
import {
  dataWithoutPorts,
  dataWithPorts,
  dataWithTargetPort,
  defaultData,
  internalImageData,
} from './deployImage-submit-utils-data';

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
    const k8sCreate = jest.spyOn(k8s, 'k8sCreate');
    const k8sUpdate = jest.spyOn(k8s, 'k8sUpdate');
    const k8sWaitForUpdate = jest.spyOn(k8s, 'k8sWaitForUpdate');

    beforeEach(() => {
      jest.resetAllMocks();
      k8sCreate.mockReturnValue(null);
      k8sUpdate.mockReturnValue(null);
      k8sWaitForUpdate.mockReturnValue(null);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call only k8sCreate when call "dry-run create"', async () => {
      k8sCreate.mockReturnValue(mockImageStreamData);

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        true,
        null,
        'create',
      );

      expect(k8sCreate).toHaveBeenCalledTimes(1);
      expect(k8sCreate).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData, {
        queryParams: { dryRun: 'All' },
      });
      expect(k8sUpdate).toHaveBeenCalledTimes(0);
      expect(k8sWaitForUpdate).toHaveBeenCalledTimes(0);
      expect(imageStream).toEqual(mockImageStreamData);
    });

    it('should call only k8sUpdate when call "dry-run update"', async () => {
      k8sUpdate.mockReturnValue(mockImageStreamData);

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        true,
        null,
        'update',
      );

      expect(k8sCreate).toHaveBeenCalledTimes(0);
      expect(k8sUpdate).toHaveBeenCalledTimes(1);
      expect(k8sUpdate).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData);
      expect(k8sWaitForUpdate).toHaveBeenCalledTimes(0);
      expect(imageStream).toEqual(mockImageStreamData);
    });

    it('should call k8sCreate and k8sWaitForUpdate when call "non-dry-run create"', async () => {
      k8sCreate.mockReturnValue(mockImageStreamData);
      k8sWaitForUpdate.mockReturnValue(Promise.resolve(mockImageStreamData));

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        false,
        null,
        'create',
      );

      expect(k8sCreate).toHaveBeenCalledTimes(1);
      expect(k8sCreate).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData, {});
      expect(k8sUpdate).toHaveBeenCalledTimes(0);
      expect(k8sWaitForUpdate).toHaveBeenCalledTimes(1);
      expect(k8sWaitForUpdate).toHaveBeenCalledWith(
        ImageStreamModel,
        mockImageStreamData,
        expect.any(Function),
        expect.any(Number),
      );
      expect(imageStream).toEqual(mockImageStreamData);
    });

    it('should call only k8sUpdate when call "non-dry-run update"', async () => {
      k8sUpdate.mockReturnValue(mockImageStreamData);

      const imageStream = await submitUtils.createOrUpdateImageStream(
        mockDeployImageFormData,
        false,
        null,
        'update',
      );

      expect(k8sCreate).toHaveBeenCalledTimes(0);
      expect(k8sUpdate).toHaveBeenCalledTimes(1);
      expect(k8sUpdate).toHaveBeenCalledWith(ImageStreamModel, mockImageStreamData);
      expect(imageStream).toEqual(mockImageStreamData);
    });
  });

  describe('createDeployment tests', () => {
    beforeAll(() => {
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
    });

    afterAll(() => {
      jest.restoreAllMocks();
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
      jest
        .spyOn(k8s, 'k8sCreate')
        .mockImplementation((model, data, dryRun) => Promise.resolve({ model, data, dryRun }));
    });

    afterAll(() => {
      jest.restoreAllMocks();
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

    it('should call KNative when creating Resources when resource is KNative', (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.KnativeService;

      const imageStreamSpy = jest
        .spyOn(submitUtils, 'createOrUpdateImageStream')
        .mockImplementation(() => ({
          status: {
            dockerImageReference: 'test:1234',
          },
        }));

      createOrUpdateDeployImageResources(mockData, false)
        .then((returnValue) => {
          // createImageStream is called as separate entity
          expect(imageStreamSpy).toHaveBeenCalled();
          expect(returnValue).toHaveLength(1);
          const models = returnValue.map((data) => _.get(data, 'model.kind'));
          expect(models).toEqual([ServiceModel.kind]);
          done();
        })
        .catch(() => {
          done();
        });
    });
  });
});
