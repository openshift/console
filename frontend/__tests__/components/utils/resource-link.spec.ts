import * as fetchUtils from '../../../public/co-fetch';
import { resourcePathFromModel } from '../../../public/components/utils/resource-link';
import { K8sKind } from '../../../public/module/k8s';
import {
  ClusterOperatorModel,
  ClusterRoleModel,
  MachineModel,
  PodModel,
  UserModel,
} from '../../../public/models';

describe('resourcePathFromModel', () => {
  beforeEach(() => {
    spyOn(fetchUtils, 'coFetch').and.callFake(() => Promise.resolve({}));
  });
  const CLUSTER_NAME = 'local-cluster';
  const CLUSTER_ROUTE_PREFIX = `/c/${CLUSTER_NAME}`;
  const testResourcePath = (
    model: K8sKind,
    name: string,
    namespace: string,
    cluster: string,
    expected: string,
  ) => {
    it(`${cluster ? `multi-cluster ` : ''}${model.plural}${name ? `/${name}` : ''}${
      namespace ? ` in namespace ${namespace}` : ''
    } into ${expected}`, () => {
      if (cluster) {
        window.SERVER_FLAGS.clusters = [CLUSTER_NAME, 'other-cluster'];
      }
      expect(resourcePathFromModel(model, name, namespace, cluster)).toEqual(expected);
    });
  };

  testResourcePath(ClusterRoleModel, 'my-role', null, null, '/k8s/cluster/clusterroles/my-role');
  testResourcePath(
    ClusterRoleModel,
    'my-role',
    null,
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/cluster/clusterroles/my-role`,
  );

  testResourcePath(ClusterRoleModel, null, null, null, '/k8s/cluster/clusterroles');
  testResourcePath(
    ClusterRoleModel,
    null,
    null,
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/cluster/clusterroles`,
  );
  testResourcePath(PodModel, 'my-pod', 'my-project', null, '/k8s/ns/my-project/pods/my-pod');
  testResourcePath(
    PodModel,
    'my-pod',
    'my-project',
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/ns/my-project/pods/my-pod`,
  );
  testResourcePath(PodModel, null, null, null, '/k8s/all-namespaces/pods');
  testResourcePath(
    PodModel,
    null,
    null,
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/all-namespaces/pods`,
  );
  testResourcePath(
    MachineModel,
    'my-machine',
    'my-project',
    null,
    '/k8s/ns/my-project/machine.openshift.io~v1beta1~Machine/my-machine',
  );
  testResourcePath(
    MachineModel,
    'my-machine',
    'my-project',
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/ns/my-project/machine.openshift.io~v1beta1~Machine/my-machine`,
  );
  testResourcePath(
    MachineModel,
    null,
    null,
    null,
    '/k8s/all-namespaces/machine.openshift.io~v1beta1~Machine',
  );
  testResourcePath(
    MachineModel,
    null,
    null,
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/all-namespaces/machine.openshift.io~v1beta1~Machine`,
  );
  testResourcePath(
    ClusterOperatorModel,
    'my-operator',
    'my-project',
    null,
    '/k8s/cluster/config.openshift.io~v1~ClusterOperator/my-operator',
  );
  testResourcePath(
    ClusterOperatorModel,
    'my-operator',
    'my-project',
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/cluster/config.openshift.io~v1~ClusterOperator/my-operator`,
  );
  testResourcePath(
    ClusterOperatorModel,
    null,
    null,
    null,
    '/k8s/cluster/config.openshift.io~v1~ClusterOperator',
  );
  testResourcePath(
    ClusterOperatorModel,
    null,
    null,
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/cluster/config.openshift.io~v1~ClusterOperator`,
  );
  testResourcePath(
    UserModel,
    'foo#bar',
    null,
    null,
    '/k8s/cluster/user.openshift.io~v1~User/foo%23bar',
  );
  testResourcePath(
    UserModel,
    'foo#bar',
    null,
    CLUSTER_NAME,
    `${CLUSTER_ROUTE_PREFIX}/k8s/cluster/user.openshift.io~v1~User/foo%23bar`,
  );
});
