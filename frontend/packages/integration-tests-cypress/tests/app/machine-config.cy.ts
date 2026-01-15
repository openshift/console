import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';

const MC_WITH_CONFIG_FILES = '00-master';
const MC_WITHOUT_CONFIG_FILES = '99-master-ssh';
const MC_DETAILS_PAGE_URL = '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig/';
const MC_SECTION_HEADING = 'Configuration files';
const MC_CONFIG_FILE_PATH_ID = 'config-file-path-0';
const MC_C2C = '.co-copy-to-clipboard__text';
const checkMachineConfigDetails = (mode, overwrite, content) => {
  cy.byTestID(MC_CONFIG_FILE_PATH_ID).scrollIntoView();
  cy.get('button[aria-label="Info"]').first().click();
  cy.contains(mode).should('exist');
  cy.contains(overwrite.toString()).should('exist');
  cy.get('code')
    .first()
    .should(($code) => {
      const text = $code.text();
      expect(text).to.include(
        decodeURIComponent(content)
          .replace(/^(data:,)/, '')
          .slice(0, 30),
      );
    });
};

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
    cy.exec(`oc get mc ${MC_WITH_CONFIG_FILES} -o jsonpath='{.spec.config.storage.files[0]}'`).then(
      (result) => {
        const mcContents = JSON.parse(result.stdout);
        expect(mcContents).to.have.property('contents');
        expect(mcContents).to.have.property('mode');
        expect(mcContents).to.have.property('overwrite');
        const {
          contents: { source },
          mode,
          overwrite,
        } = mcContents;
        checkMachineConfigDetails(mode, overwrite, source);
      },
    );
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
