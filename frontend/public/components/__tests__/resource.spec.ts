import { PodModel, UserModel } from '../../models';
import type { K8sKind } from '../../module/k8s';
import { resourceURL } from '../../module/k8s';

type ResourceURLOptions = {
  name?: string;
  ns?: string;
  queryParams?: any;
};

describe('resourceURL', () => {
  const testResourceURL = (model: K8sKind, options: ResourceURLOptions, expected: string) => {
    it(`${model.plural}${options.name ? `/${options.name}` : ''}${
      options.ns ? ` in namespace ${options.ns}` : ''
    } into ${expected}`, () => {
      expect(resourceURL(model, options)).toEqual(expected);
    });
  };

  testResourceURL(PodModel, { ns: 'test' }, '/api/kubernetes/api/v1/namespaces/test/pods');
  testResourceURL(
    PodModel,
    { ns: 'test', name: 'hello-openshift' },
    '/api/kubernetes/api/v1/namespaces/test/pods/hello-openshift',
  );
  testResourceURL(
    PodModel,
    { ns: 'test', name: 'hello-openshift' },
    '/api/kubernetes/api/v1/namespaces/test/pods/hello-openshift',
  );
  testResourceURL(
    UserModel,
    { name: 'alice' },
    '/api/kubernetes/apis/user.openshift.io/v1/users/alice',
  );
  testResourceURL(
    UserModel,
    { name: 'foo#bar' },
    '/api/kubernetes/apis/user.openshift.io/v1/users/foo%23bar',
  );
});
