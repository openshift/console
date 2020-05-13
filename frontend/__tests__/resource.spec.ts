import '../__mocks__/localStorage';
import { k8sCreate, K8sKind, resourceURL } from '../public/module/k8s';
import { PodModel, UserModel } from '../public/models';

type ResourceURLOptions = {
  name?: string;
  ns?: string;
  queryParams?: any;
};

describe('k8s.k8sResource', () => {
  describe('create', () => {
    it('automatically lowercases resource name', () => {
      const data = { metadata: { name: 'TEST' }, spec: { volumes: [] } };

      k8sCreate(PodModel, data);
      // Since we're passing by reference we
      // can simply assert about the mutation of
      // the object here.
      expect(data.metadata.name).toEqual('test');
    });
  });
});

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
