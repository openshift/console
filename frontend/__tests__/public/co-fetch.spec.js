import { shouldLogout } from '../../public/co-fetch';

describe('coFetch', () => {
  it('logs out users who get a 401 from k8s', () => {
    expect(shouldLogout('/api/kubernetes/api/v1/pods')).toEqual(true);
  });

  it('respects basePath and logs out users who get a 401 from k8s', () => {
    const originalBasePath = window.SERVER_FLAGS.basePath;
    window.SERVER_FLAGS.basePath = '/blah/';
    expect(shouldLogout('/blah/api/kubernetes/api/v1/pods')).toEqual(true);
    window.SERVER_FLAGS.basePath = originalBasePath;
  });

  it('does not log out users who get a 401 from chargeback', () => {
    expect(shouldLogout('/api/kubernetes/api/v1/namespaces/prd354/services/chargeback/proxy/api')).toEqual(false);
  });

  it('does not log out users who get a 401 from graphs', () => {
    expect(shouldLogout('/api/kubernetes/api/v1/proxy/namespaces/tectonic-system/services/prometheus:9090/api/v1/query?query=100%20-%20(sum(rate(node_cpu%7Bjob%3D%22node-exporter%22%2Cmode%3D%22idle%22%7D%5B2m%5D))%20%2F%20count(node_cpu%7Bjob%3D%22node-exporter%22%2C%20mode%3D%22idle%22%7D))%20*%20100')).toEqual(false);
  });
});
