import * as _ from 'lodash';
import { mockDeployImageFormData } from '../../components/import/__mocks__/deployImage-validation-mock';
import { mockFormData } from '../../components/import/__mocks__/import-validation-mock';
import { GitImportFormData, DeployImageFormData } from '../../components/import/import-types';
import { createService, createRoute } from '../shared-submit-utils';

describe('Shared submit utils', () => {
  describe('Create Service', () => {
    it('should set the correct ports in service object', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);
      const mockDeployImageData: DeployImageFormData = _.cloneDeep(mockDeployImageFormData);
      const PORT = { containerPort: 8081, protocol: 'TCP' };
      let serviceObj;

      mockData.build.strategy = 'Docker';
      mockData.route.unknownTargetPort = '8080';
      serviceObj = createService(mockData);
      expect(serviceObj.spec.ports[0].port).toEqual(8080);

      mockDeployImageData.isi.ports = [PORT];
      serviceObj = createService(mockDeployImageData);
      expect(serviceObj.spec.ports[0].port).toEqual(8081);
    });

    it('should match the previous snapshot created with git import data', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);
      const serviceObj = createService(mockData);
      expect(serviceObj).toMatchSnapshot();
    });

    it('should match the previous snapshot created with deploy image data', () => {
      const mockDeployImageData: DeployImageFormData = _.cloneDeep(mockDeployImageFormData);
      const serviceObj = createService(mockDeployImageData);
      expect(serviceObj).toMatchSnapshot();
    });

    it('should expose only the custom port as TargetPort when it is set', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);

      mockData.build.strategy = 'Source';
      mockData.git.url = 'https://github.com/nodeshift-blog-examples/react-web-app';
      mockData.route.unknownTargetPort = '3000';
      const serviceObj = createService(mockData);
      const ports = serviceObj?.spec?.ports;

      expect(ports).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            port: 8080,
          }),
        ]),
      );
    });

    it('While editing, the new custom route port must replace the current route port from services', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);

      mockData.build.strategy = 'Source';
      mockData.git.url = 'https://github.com/nodeshift-blog-examples/react-web-app';
      mockData.image.ports = [
        { containerPort: 8080, protocol: 'TCP' },
        { containerPort: 8081, protocol: 'TCP' },
        { containerPort: 8082, protocol: 'TCP' },
      ];
      mockData.route.unknownTargetPort = '8080';
      let serviceObj = createService(mockData);

      mockData.route.unknownTargetPort = '3000';
      serviceObj = createService(mockData);

      const ports = serviceObj?.spec?.ports;

      expect(ports).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            port: 8080,
          }),
        ]),
      );
    });
  });

  describe('Create Route', () => {
    it('should set correct target port in route object', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);
      const mockDeployImageData: DeployImageFormData = _.cloneDeep(mockDeployImageFormData);
      let routeObj;

      mockData.build.strategy = 'Docker';
      mockData.route.unknownTargetPort = '8080';
      routeObj = createRoute(mockData);
      expect(routeObj.spec.port.targetPort).toEqual('8080-tcp');

      const PORT = { containerPort: 8082, protocol: 'TCP' };
      mockDeployImageData.isi.ports = [PORT];
      routeObj = createRoute(mockDeployImageData);
      expect(routeObj.spec.port.targetPort).toEqual('8082-tcp');

      mockDeployImageData.route.unknownTargetPort = '8081';
      routeObj = createRoute(mockDeployImageData);
      expect(routeObj.spec.port.targetPort).toEqual('8081-tcp');
    });

    it('should set correct route labels if custom labels are set', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);
      mockData.route.labels = {
        'custom-route-label': 'a-custom-route-label',
      };
      mockData.labels = {
        'shared-label': 'a-shared-label-value',
      };
      const routeObj = createRoute(mockData);
      expect(routeObj?.metadata?.labels).toEqual({
        app: 'test-app',
        'app.kubernetes.io/component': 'test-app',
        'app.kubernetes.io/instance': 'test-app',
        'app.kubernetes.io/name': 'test-app',
        'app.kubernetes.io/part-of': 'mock-app',
        'app.openshift.io/runtime-version': 'latest',
        'shared-label': 'a-shared-label-value',
        'custom-route-label': 'a-custom-route-label',
      });
    });

    it('should match the previous snapshot with git import data', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);
      mockData.route.targetPort = '8080-tcp';
      const routeObj = createRoute(mockData);
      expect(routeObj).toMatchSnapshot();
    });

    it('should match the previous snapshot deploy image data', () => {
      const mockDeployImageData: DeployImageFormData = _.cloneDeep(mockDeployImageFormData);
      mockDeployImageData.route.targetPort = '8080-tcp';
      const routeObj = createRoute(mockDeployImageData);
      expect(routeObj).toMatchSnapshot();
    });
  });
});
