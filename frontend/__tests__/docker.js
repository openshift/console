import { getContainerStatus, isEnvVarEmpty, isVolumeMountEmpty, isPortEmpty } from '../public/module/k8s/docker';

describe('k8sDocker', () => {
  describe('#getContainerStatus', () => {
    it('returns falsy when pod has no container status with given name', () => {
      expect(getContainerStatus(
        // pod
        {
          status: {
            containerStatuses: [
              {name: 'ACAEB740-01D1-4D43-BB7B-68EBFD484701'},
              {name: '06DB4D15-3A24-482B-82B1-A46337D8C2DD'},
              {name: '7AE75BB5-B562-4D5A-B880-F529797CAD5F'}
            ]
          }
        },

        // container name
        '9242B9F6-A50A-4330-8C0E-B18EA4672A89'
      )).toBeFalsy();
    });

    it('returns container status with given name', () => {
      expect(getContainerStatus(
        // pod
        {
          status: {
            containerStatuses: [
              {name: 'ACAEB740-01D1-4D43-BB7B-68EBFD484701'},
              {name: '9242B9F6-A50A-4330-8C0E-B18EA4672A89', status: 'running'},
              {name: '7AE75BB5-B562-4D5A-B880-F529797CAD5F'}
            ]
          }
        },

        // container name
        '9242B9F6-A50A-4330-8C0E-B18EA4672A89'
      )).toEqual({name: '9242B9F6-A50A-4330-8C0E-B18EA4672A89', status: 'running'});
    });
  });

  describe('#isEnvVarEmpty', () => {
    it('returns false when env var has non-falsy name', () => {
      expect(isEnvVarEmpty({name: 'PORT', value: 3000})).toEqual(false);
    });

    it('returns true when env var has falsy name', () => {
      expect(isEnvVarEmpty({name: '', value: 3000})).toEqual(true);
    });
  });

  describe('#isVolumeMountEmpty', () => {
    it('returns false when volume mount has both non-falsy name and mount path', () => {
      expect(isVolumeMountEmpty({name: 'grafana', mountPath: '/var/lib/grafana'})).toEqual(false);
    });

    it('returns true when volume mount has falsy name', () => {
      expect(isVolumeMountEmpty({name: '', mountPath: '/var/lib/grafana'})).toEqual(true);
    });

    it('returns true when volume mount has falsy mount path', () => {
      expect(isVolumeMountEmpty({name: 'grafana', mountPath: ''})).toEqual(true);
    });
  });

  describe('#isPortEmpty', () => {
    it('returns false when port has both non-falsy name and container port', () => {
      expect(isPortEmpty({name: 'HTTP', containerPort: 80})).toEqual(false);
    });

    it('returns true when port has falsy name', () => {
      expect(isPortEmpty({name: '', containerPort: 80})).toEqual(true);
    });

    it('returns true when port has nully container port', () => {
      expect(isPortEmpty({name: 'HTTP', containerPort: null})).toEqual(true);
    });
  });
});
