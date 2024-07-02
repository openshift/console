import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';

const MC_WITH_CONFIG_FILES = '00-master';
const MC_WITHOUT_CONFIG_FILES = '99-master-ssh';
const MC_DETAILS_PAGE_URL = '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig/';
const MC_SECTION_HEADING = 'Configuration files';
const MC_CONFIG_FILE_PATH_ID = 'config-file-path-0';
const MC_C2C = '.co-copy-to-clipboard__text';

describe('MachineConfig resource details page', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  it(`${MC_WITH_CONFIG_FILES} displays configuration files`, () => {
    cy.visit(`${MC_DETAILS_PAGE_URL}${MC_WITH_CONFIG_FILES}`);
    detailsPage.titleShouldContain(`${MC_WITH_CONFIG_FILES}`);
    detailsPage.isLoaded();
    cy.byTestSectionHeading(MC_SECTION_HEADING).should('exist');
    cy.byTestID(MC_CONFIG_FILE_PATH_ID).should('exist');
    cy.get(MC_C2C).should('exist');
  });

  it(`${MC_WITHOUT_CONFIG_FILES} does not display configuration files`, () => {
    cy.visit(`${MC_DETAILS_PAGE_URL}${MC_WITHOUT_CONFIG_FILES}`);
    detailsPage.titleShouldContain(`${MC_WITHOUT_CONFIG_FILES}`);
    detailsPage.isLoaded();
    cy.byTestSectionHeading(MC_SECTION_HEADING).should('not.exist');
    cy.byTestID(MC_CONFIG_FILE_PATH_ID).should('not.exist');
    cy.get(MC_C2C).should('not.exist');
  });
});
