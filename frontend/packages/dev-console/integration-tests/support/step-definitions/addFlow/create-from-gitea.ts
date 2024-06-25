import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { gitPage } from '../../pages';

/*
    INFORMATION REGARDING GITEA SERVER
    ==================================
    Gitea Helm chart used: https://github.com/redhat-cop/helm-charts/tree/main/charts/gitea

    Gitea Server URL: http://gitea.<cluster-url>
    Gitea Server Username: dev
    Gitea Server Password: 123456
    
    Pre-loaded Repositories:
    - [Gitea Username/Repository Name] = [Corresponding Cloned GitHub Repository URL]
    - ["dev/nodejs"]="https://github.com/johnpapa/node-hello.git"
    - ["dev/dockerfile-node"]="https://github.com/Lucifergene/knative-do-demo"
    - ["dev/devfile"]="https://github.com/nodeshift-starters/devfile-sample"
    - ["dev/pac"]="https://github.com/Lucifergene/oc-pipe"
    - ["dev/serv-func"]="https://github.com/Lucifergene/oc-func"   
*/

Given('user has installed Gitea Server with pre-loaded repositories', () => {
  cy.exec(`oc apply -f testData/add-flow/gitea-setup.yaml`);
  cy.wait(15000);
  cy.exec(
    `oc wait job.batch --for=condition=Complete=True --timeout=13m -n gitea gitea-install-job`,
    { timeout: 220000 },
  );
});

When('user enters Gitea Repo Name as {string}', (repoName: string) => {
  cy.exec('oc whoami --show-console', {
    failOnNonZeroExit: false,
  }).then(function (result) {
    const consoleUrl = result.stdout;
    const giteaUrl = consoleUrl.replace('https://console-openshift-console', 'http://gitea');
    const gitUrl = `${giteaUrl}/dev/${repoName}`;
    gitPage.enterGitUrl(gitUrl);
    gitPage.verifyValidatedMessage(gitUrl);
  });
});

Then('user deletes the Gitea Server', () => {
  cy.exec(`oc delete -f testData/add-flow/gitea-setup.yaml`);
  cy.wait(30000);
});
