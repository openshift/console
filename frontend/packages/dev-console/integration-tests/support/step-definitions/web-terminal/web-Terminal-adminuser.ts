import { Then, And } from 'cypress-cucumber-preprocessor/steps';
import { devWorkspaceStatuses } from '../../constants';
import { projectNameSpace } from '../../pages';
import { devWorkspacePage } from '../../pages/devworspace/devworkspacePage';
import { searchResource } from '../../pages/search-resources/search-page';

Then('user will get created DevWorkspace instance in {string} namespace', (a: string) => {
  searchResource.searchResourceByNameAsAdmin('DevWorkspace');
  searchResource.verifyItemInSearchResultsByPreffixName(a);
  searchResource.selectSearchedItem('terminal');
  devWorkspacePage.verifyDevWsResourceStatus(devWorkspaceStatuses.running);
});

And(
  'user ID obtained by API should match with user id in yaml editor for {string} namespace',
  (terminalNamespace: string) => {
    let k8sUserId: string = '';
    let devWsName: string = '';
    let devWsNamePrefURI = `/workspace.devfile.io/v1alpha1/namespaces/${terminalNamespace}/devworkspaces/?limit=250&labelSelector=console.openshift.io%2Fterminal%3Dtrue%2Ccontroller.devfile.io%2Fcreator%3D`;

    const baseUrl = Cypress.config('baseUrl');
    const apiPrefURI = `${baseUrl}/api/kubernetes/apis`;
    const userApiPrefURI = '/user.openshift.io/v1/users/~';
    const linkToYamlEditorPrefURI = `${baseUrl}/k8s/ns/${terminalNamespace}/workspace.devfile.io~v1alpha1~DevWorkspace/`;

    // get user ID with the Cypress request to k8s API
    cy.request(apiPrefURI + userApiPrefURI)
      .then((responce) => {
        k8sUserId = responce.body.metadata.uid;
      })
      // add to devworkspce URI rhe user id suffix and send request for complited URL
      .then(() => {
        devWsNamePrefURI += k8sUserId;
      })
      .then(() => cy.log(devWsNamePrefURI))
      .then(() => cy.request(`${apiPrefURI}${devWsNamePrefURI}`))
      // get the current uniq name of devworkspace
      .then((responce) => {
        devWsName = responce.body.items[0].metadata.name;
      })
      // go to the yaml editor by direct URL  and assert user ids in the editor and obteined with API request
      .then(() => {
        cy.visit(`${linkToYamlEditorPrefURI}${devWsName}/yaml`);
      })
      .then(() => {
        cy.get('div.lines-content.monaco-editor-background').should('include.text', k8sUserId);
      });
  },
);

Then('user will see the terminal instance for namespace {string}', (nameSpace: string) => {
  projectNameSpace.selectProject(nameSpace);
  searchResource.searchResourceByNameAsAdmin('DevWorkspace');
  searchResource.selectSearchedItem('terminal');
  devWorkspacePage.verifyDevWsResourceStatus(devWorkspaceStatuses.running);
});
