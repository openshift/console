import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { projectDropdown } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import * as yamlEditor from '../../views/yaml-editor';

const quotaName = 'example-resource-quota';
const clusterQuotaName = 'example-cluster-resource-quota';
const allProjectsDropdownLabel = 'All Projects';

const createExampleQuotas = () => {
  cy.log('create quota instance');
  nav.sidenav.clickNavLink(['Administration', 'ResourceQuotas']);
  projectDropdown.selectProject(testName);
  projectDropdown.shouldContain(testName);
  listPage.clickCreateYAMLbutton();
  // sidebar needs to be fully loaded, else it sometimes overlays the Create button
  cy.byTestID('resource-sidebar').should('exist');
  yamlEditor.isLoaded();
  let newContent;
  yamlEditor.getEditorContent().then((content) => {
    newContent = _.defaultsDeep({}, { metadata: { name: quotaName } }, safeLoad(content));
    yamlEditor.setEditorContent(safeDump(newContent)).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.get(errorMessage).should('not.exist');
    });
  });
  detailsPage.breadcrumb(0).click();

  cy.log('create cluster quota instance');
  listPage.clickCreateYAMLbutton();
  cy.byTestID('resource-sidebar').should('exist');
  yamlEditor.isLoaded();
  yamlEditor.getEditorContent().then((content) => {
    newContent = _.defaultsDeep(
      {},
      {
        kind: 'ClusterResourceQuota',
        apiVersion: 'quota.openshift.io/v1',
        metadata: { name: clusterQuotaName },
        spec: {
          quota: {
            hard: {
              pods: '10',
              secrets: '10',
            },
          },
          selector: {
            labels: {
              matchLabels: {
                'kubernetes.io/metadata.name': testName,
              },
            },
          },
        },
      },
      safeLoad(content),
    );
    yamlEditor.setEditorContent(safeDump(newContent)).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.get(errorMessage).should('not.exist');
    });
  });
};

const deleteClusterExamples = () => {
  cy.log('delete ClusterResourceQuota instance');
  projectDropdown.selectProject(allProjectsDropdownLabel);
  nav.sidenav.clickNavLink(['Administration', 'ResourceQuotas']);
  listPage.rows.shouldBeLoaded();
  listPage.filter.byName(clusterQuotaName);
  listPage.rows.clickRowByName(clusterQuotaName);
  detailsPage.isLoaded();
  detailsPage.clickPageActionFromDropdown('Delete ClusterResourceQuota');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
  detailsPage.isLoaded();
};

describe('Quotas', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
    createExampleQuotas();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    deleteClusterExamples();
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`'All Projects' shows ResourceQuotas`, () => {
    nav.sidenav.clickNavLink(['Administration', 'ResourceQuotas']);
    projectDropdown.selectProject(allProjectsDropdownLabel);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(quotaName);
    listPage.rows.shouldExist(quotaName);
  });

  it(`'All Projects' shows ClusterResourceQuotas`, () => {
    nav.sidenav.clickNavLink(['Administration', 'ResourceQuotas']);
    projectDropdown.selectProject(allProjectsDropdownLabel);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(clusterQuotaName);
    listPage.rows.shouldExist(clusterQuotaName);
    listPage.rows.clickRowByName(clusterQuotaName);
    detailsPage.isLoaded();
    detailsPage.breadcrumb(0).contains('ClusterResourceQuota');
  });

  it(`Test namespace shows ResourceQuotas`, () => {
    nav.sidenav.clickNavLink(['Administration', 'ResourceQuotas']);
    projectDropdown.selectProject(testName);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(quotaName);
    listPage.rows.shouldExist(quotaName);
  });

  it(`Test namespace shows AppliedClusterResourceQuotas`, () => {
    nav.sidenav.clickNavLink(['Administration', 'ResourceQuotas']);
    projectDropdown.selectProject(testName);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(clusterQuotaName);
    listPage.rows.shouldExist(clusterQuotaName);
    listPage.rows.clickRowByName(clusterQuotaName);
    detailsPage.isLoaded();
    detailsPage.breadcrumb(0).contains('AppliedClusterResourceQuota');
  });
});
