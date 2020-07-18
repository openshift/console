import { OdcBaseNode } from '../../elements/OdcBaseNode';
import { TYPE_HELM_RELEASE } from '../components/const';

export const mockManifest = [
  {
    kind: 'Secret',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'mysql2-pvc2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'ConfigMap',
    metadata: {
      name: 'mysql2-test',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'Deployment',
    metadata: {
      name: 'mysql2-d2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'Service',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'Deployment',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
];

export const mockReleaseNotes =
  // eslint-disable-next-line no-template-curly-in-string
  'MySQL can be accessed via port 3306 on the following DNS name from within your cluster:\nmysql2.jeff-project.svc.cluster.local\n\nTo get your root password run:\n\n    MYSQL_ROOT_PASSWORD=$(kubectl get secret --namespace jeff-project mysql2 -o jsonpath="{.data.mysql-root-password}" | base64 --decode; echo)\n\nTo connect to your database:\n\n1. Run an Ubuntu pod that you can use as a client:\n\n    kubectl run -i --tty ubuntu --image=ubuntu:16.04 --restart=Never -- bash -il\n\n2. Install the mysql client:\n\n    $ apt-get update && apt-get install mysql-client -y\n\n3. Connect using the mysql cli, then provide your password:\n    $ mysql -h mysql2 -p\n\nTo connect to your database directly from outside the K8s cluster:\n    MYSQL_HOST=127.0.0.1\n    MYSQL_PORT=3306\n\n    # Execute the following command to route the connection:\n    kubectl port-forward svc/mysql2 3306\n\n    mysql -h ${MYSQL_HOST} -P${MYSQL_PORT} -u root -p${MYSQL_ROOT_PASSWORD}\n    \n';

export const mockHelmReleaseNode = new OdcBaseNode();
const helmModel = {
  id: 'mock-helm-release-id',
  type: TYPE_HELM_RELEASE,
  label: '',
  resource: {
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: {
      namespace: 'test-namespace',
    },
  },
  data: {
    resources: {},
    groupResources: [
      {
        resources: {
          obj: {
            metadata: {
              namespace: 'test-namespace',
            },
          },
        },
      },
    ],
    data: {
      releaseName: '',
      manifestResources: [],
      releaseNotes: mockReleaseNotes,
    },
  },
};
mockHelmReleaseNode.setModel(helmModel);
