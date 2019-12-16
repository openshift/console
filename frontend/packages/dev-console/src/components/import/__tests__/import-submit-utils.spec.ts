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
import { defaultData, nodeJsBuilderImage as buildImage } from './import-submit-utils-data';

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

    it('should set annotations for triggers while creating deployment', (done) => {
      createOrUpdateDeployment(defaultData, buildImage.obj, false)
        .then((returnValue) => {
          const annotations = _.get(returnValue, 'data.metadata.annotations');
          expect(JSON.parse(annotations['image.openshift.io/triggers'])).toEqual([
            {
              from: { kind: 'ImageStreamTag', name: 'nodejs-ex-git:latest' },
              fieldPath: 'spec.template.spec.containers[?(@.name=="nodejs-ex-git")].image',
            },
          ]);
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

      createOrUpdateDeployment(data, buildImage.obj, false)
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

    it('should call createDeployment when resource is Kubernetes', (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.Kubernetes;

      createOrUpdateResources(mockData, buildImage.obj, false)
        .then((returnValue) => {
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
        })
        .catch(() => {
          done();
        });
    });

    it('should not createDeploymentConfig when resource is OpenShift', (done) => {
      const mockData = _.cloneDeep(defaultData);
      mockData.resources = Resources.OpenShift;

      createOrUpdateResources(mockData, buildImage.obj, false)
        .then((returnValue) => {
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

      createOrUpdateResources(mockData, buildImage.obj, false)
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
