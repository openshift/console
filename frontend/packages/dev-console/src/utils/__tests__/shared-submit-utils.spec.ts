import * as _ from 'lodash';
import { mockFormData } from '../../components/import/__mocks__/import-validation-mock';
import { mockDeployImageFormData } from '../../components/import/__mocks__/deployImage-validation-mock';
import { createService, createRoute } from '../shared-submit-utils';
import { GitImportFormData, DeployImageFormData } from '../../components/import/import-types';

describe('Shared submit utils', () => {
  describe('Create Service', () => {
    it('should set the correct ports in service object', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);
      const mockDeployImageData: DeployImageFormData = _.cloneDeep(mockDeployImageFormData);
      const PORT1 = { containerPort: 8081, protocol: 'TCP' };
      let serviceObj;

      mockData.build.strategy = 'Docker';
      mockData.docker.containerPort = 8080;
      serviceObj = createService(mockData);
      expect(serviceObj.spec.ports[0].port).toEqual(8080);

      mockDeployImageData.image.ports = [PORT1];
      serviceObj = createService(mockDeployImageData);
      expect(serviceObj.spec.ports[0].port).toEqual(8081);
    });
  });

  describe('Create Route', () => {
    it('should set correct target port in route object', () => {
      const mockData: GitImportFormData = _.cloneDeep(mockFormData);
      const mockDeployImageData: DeployImageFormData = _.cloneDeep(mockDeployImageFormData);
      let routeObj;

      mockData.build.strategy = 'Docker';
      mockData.docker.containerPort = 8080;
      routeObj = createRoute(mockData);
      expect(routeObj.spec.port.targetPort).toEqual('8080-tcp');

      mockDeployImageData.route.targetPort = '8081-tcp';
      routeObj = createRoute(mockDeployImageData);
      expect(routeObj.spec.port.targetPort).toEqual('8081-tcp');
    });
  });
});
