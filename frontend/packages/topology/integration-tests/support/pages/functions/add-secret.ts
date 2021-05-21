import { editDeployment } from '@console/topology/integration-tests/support/pages/topology/topology-edit-deployment';

export const addSecret = (
  secretName: string = 'newSecret 1',
  serverUrl: string = 'https://quay.io/repository/kubernetes-ingress-controller/nginx-ingress-controller?tag=latest&tab=tags',
  username: string = 'test1',
  password: string = 'test',
  email: string = 'test1@redhat.com',
) => {
  editDeployment.verifyModalTitle();
  editDeployment.addSecretName(secretName);
  editDeployment.addServerAddress(serverUrl);
  editDeployment.enterUsername(username);
  editDeployment.enterPassword(password);
  editDeployment.enterEmail(email);
  editDeployment.saveSecret();
};
