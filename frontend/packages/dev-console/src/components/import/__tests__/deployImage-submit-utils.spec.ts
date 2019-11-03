import { ensurePortExists } from '../deployImage-submit-utils';
import { DeployImageFormData } from '../import-types';
import { getSuggestedName } from '../../../utils/imagestream-utils';
import {
  dataWithoutPorts,
  dataWithPorts,
  dataWithTargetPort,
  defaultData,
} from './deployImage-submit-utils-data';

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
});
