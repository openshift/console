import * as _ from 'lodash';
import * as k8s from '@console/internal/module/k8s';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { DeployImageFormData, Resources } from '../import-types';
import { getSuggestedName } from '../../../utils/imagestream-utils';
import * as submitUtils from '../deployImage-submit-utils';
import {
  dataWithoutPorts,
  dataWithPorts,
  dataWithTargetPort,
  defaultData,
  internalImageData,
} from './deployImage-submit-utils-data';

const { ensurePortExists, createDeployment, createResources } = submitUtils;

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
      createDeployment(internalImageData, false)
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

    it('should assign limits on creating Deployment', (done) => {
      const data = _.cloneDeep(defaultData);
      data.limits = {
        cpu: {
          request: 5,
          requestUnit: 'm',
          limit: 10,
          limitUnit: 'm',
        },
        memory: {
          request: 100,
          requestUnit: 'Mi',
          limit: 200,
          limitUnit: 'Mi',
        },
      };

      createDeployment(data, false)
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
      createResources(defaultData, false)
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
      createResources(internalImageData, false)
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
        .spyOn(submitUtils, 'createImageStream')
        .mockImplementation(() => ({
          status: {
            dockerImageReference: 'test:1234',
          },
        }));

      createResources(mockData, false)
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
