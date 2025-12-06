import * as coFetchModule from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { resourcePathFromModel } from '../../../components/utils/resource-link';
import { K8sKind } from '../../../module/k8s';
import {
  ClusterOperatorModel,
  ClusterRoleModel,
  MachineModel,
  PodModel,
  UserModel,
} from '../../../models';

jest.mock('@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch');
  return {
    ...actual,
    consoleFetch: jest.fn(),
  };
});

const consoleFetchMock = coFetchModule.consoleFetch as jest.Mock;

describe('resourcePathFromModel', () => {
  beforeEach(() => {
    consoleFetchMock.mockImplementation(() => Promise.resolve({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  const testResourcePath = (model: K8sKind, name: string, namespace: string, expected: string) => {
    it(`${model.plural}${name ? `/${name}` : ''}${
      namespace ? ` in namespace ${namespace}` : ''
    } into ${expected}`, () => {
      expect(resourcePathFromModel(model, name, namespace)).toEqual(expected);
    });
  };

  testResourcePath(ClusterRoleModel, 'my-role', null, '/k8s/cluster/clusterroles/my-role');
  testResourcePath(ClusterRoleModel, null, null, '/k8s/cluster/clusterroles');
  testResourcePath(PodModel, 'my-pod', 'my-project', '/k8s/ns/my-project/pods/my-pod');
  testResourcePath(PodModel, null, null, '/k8s/all-namespaces/pods');
  testResourcePath(
    MachineModel,
    'my-machine',
    'my-project',
    '/k8s/ns/my-project/machine.openshift.io~v1beta1~Machine/my-machine',
  );
  testResourcePath(
    MachineModel,
    null,
    null,
    '/k8s/all-namespaces/machine.openshift.io~v1beta1~Machine',
  );
  testResourcePath(
    ClusterOperatorModel,
    'my-operator',
    'my-project',
    '/k8s/cluster/config.openshift.io~v1~ClusterOperator/my-operator',
  );
  testResourcePath(
    ClusterOperatorModel,
    null,
    null,
    '/k8s/cluster/config.openshift.io~v1~ClusterOperator',
  );
  testResourcePath(UserModel, 'foo#bar', null, '/k8s/cluster/user.openshift.io~v1~User/foo%23bar');
});
