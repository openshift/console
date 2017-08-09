import { getContainerStatus } from '../public/module/k8s/docker';

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
});
