import {
  serviceAccountJSON,
  roleBindingJSON,
  getPVCJSON,
  configMapJSON,
  deploymentJson,
  serviceJSON,
  routeJSON,
  networkPolicyJSON,
  testDeploymentJSON,
} from '../helpers/vault';
import { commandPoll } from '../views/common';

export const configureVault = () => {
  cy.exec('oc get project hashicorp', {
    failOnNonZeroExit: false,
  }).then(({ code }) => {
    // Deploy vault only if doesn't already exist
    if (code !== 0) {
      cy.log('Create a new project for internel vault');
      cy.exec('oc new-project hashicorp');

      cy.log('Creating CR to configure vault');
      cy.exec(`echo '${JSON.stringify(serviceAccountJSON)}' | oc apply -f -`);
      cy.exec(`echo '${JSON.stringify(roleBindingJSON)}' | oc apply -f -`);
      cy.exec(`echo '${JSON.stringify(getPVCJSON)}' | oc apply -f -`);
      cy.exec(`echo '${JSON.stringify(configMapJSON)}' | oc apply -f -`);

      cy.log('Deploying vault');
      cy.exec(`echo '${JSON.stringify(deploymentJson)}' | oc apply -f -`);
      cy.exec(`echo '${JSON.stringify(serviceJSON)}' | oc apply -f -`);

      cy.log('Generating vault keys and token');
      cy.exec('oc get pods --no-headers -o custom-columns=":metadata.name"').then((pod) => {
        const podName: string = pod.stdout;

        cy.log('Checking vault pod rsh is possible');
        commandPoll(`oc exec -ti ${podName} hostname`, podName, false);

        cy.exec(
          `oc exec -ti ${podName} -- vault operator init --key-shares=1 --key-threshold=1 --format=json`,
        ).then((vault) => {
          const vaultObj = JSON.parse(vault.stdout);
          const vaultKeys = vaultObj?.unseal_keys_b64;
          const vaultToken = vaultObj?.root_token;
          cy.log('Unsealing Vault');
          cy.exec(`oc exec  -ti ${podName} -- vault operator unseal ${vaultKeys[0]}`);
          cy.log('Enabling a key/value secrets engine');
          cy.exec(
            `oc exec  -ti ${podName} -- /bin/sh -c 'export VAULT_TOKEN=${vaultToken} &&  vault secrets enable -path=secret kv'`,
          );
          cy.log(`vault token = ${vaultToken}`);
          cy.exec(
            `oc create secret generic ceph-csi-kms-token --from-literal=token=${vaultToken} -n default`,
          );
          cy.exec(`echo '${JSON.stringify(testDeploymentJSON)}' | oc apply -f -`);
        });
      });

      cy.log('Configuring router');
      cy.exec(`echo '${JSON.stringify(routeJSON)}' | oc apply -f -`);
      cy.exec(`echo '${JSON.stringify(networkPolicyJSON)}' | oc apply -f -`);
    } else {
      cy.log('Vault is already deployed');
    }
  });
};

export const isPodRunningWithEncryptedPV = () => {
  cy.log('Checking pod is up and running with encrypted PV');
  commandPoll(
    `oc get Deployment ${testDeploymentJSON.metadata.name} -n default -ojsonpath='{.status.availableReplicas}'`,
    '1',
  );
};
