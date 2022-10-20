import { checkErrors, testName } from '../../support';
import { projectDropdown } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { submitButton, errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

const shouldBeWatchdogAlertDetailsPage = () => {
  cy.byTestID('resource-title').contains('Watchdog');
  detailsPage.sectionHeaderShouldExist('Alert details');
  detailsPage.labelShouldExist('alertname=Watchdog');
};

const shouldBeWatchdogAlertRulesPage = () => {
  cy.byTestID('resource-title').contains('Watchdog');
  detailsPage.sectionHeaderShouldExist('Alerting rule details');
  detailsPage.sectionHeaderShouldExist('Active alerts');
};

const shouldBeWatchdogSilencePage = () => {
  cy.byTestID('resource-title').contains('Watchdog');
  detailsPage.sectionHeaderShouldExist('Silence details');
  detailsPage.labelShouldExist('alertname=Watchdog');
};

describe('Monitoring: Alerts', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it('displays and filters the Alerts list page, links to detail pages', () => {
    cy.log('use sidebar nav to go to Observe -> Alerting');
    nav.sidenav.clickNavLink(['Observe', 'Alerting']);
    // TODO, switch to 'listPage.titleShouldHaveText('Alerting');', when we switch to new test id
    cy.byLegacyTestID('resource-title').should('have.text', 'Alerting');
    projectDropdown.shouldNotExist();
    listPage.rows.shouldBeLoaded();
    cy.testA11y('Monitor Alerting list page');

    cy.log('filter Alerts');
    listPage.filter.byName('Watchdog');
    listPage.rows.countShouldBe(1);

    cy.log('drills down to Alert details page');
    listPage.rows.shouldExist('Watchdog').click();
    shouldBeWatchdogAlertDetailsPage();
    cy.testA11y('Alerting details page');

    cy.log('drill down to the Alerting rule details page');
    cy.byTestID('alert-rules-detail-resource-link')
      .contains('Watchdog')
      .click();
    shouldBeWatchdogAlertRulesPage();
    cy.testA11y('Alerting rule details page');

    cy.log('drill back up to the Alert details page');
    // Active alerts list should contain a link back to the Alert details page
    cy.byTestID('active-alerts')
      .first()
      .click();
    shouldBeWatchdogAlertDetailsPage();
  });

  it('creates and expires a Silence', () => {
    cy.visit('monitoring/alerts');
    listPage.rows.shouldBeLoaded();
    cy.log('filter to Watchdog alert');
    listPage.filter.byName('Watchdog');
    listPage.rows.countShouldBe(1);
    listPage.rows.shouldExist('Watchdog').click();
    shouldBeWatchdogAlertDetailsPage();

    cy.log('silence Watchdog alert');
    // After creating the Silence, should be redirected to its details page
    detailsPage.clickPageActionButton('Silence alert');
    // launches page form
    cy.byTestID('silence-start-immediately').should('be.checked');
    cy.byTestID('silence-from').should('have.value', 'Now');
    cy.byTestID('silence-for').should('contain', '2h');
    cy.byTestID('silence-until').should('have.value', '2h from now');
    // Change duration
    cy.byTestID('silence-for-toggle').click();
    cy.byTestID('silence-for').should('contain', '1h');
    cy.byTestID('silence-for')
      .contains(/^1h$/)
      .click();
    cy.byTestID('silence-until').should('have.value', '1h from now');
    // Change to not start now
    cy.byTestID('silence-start-immediately').click();
    cy.byTestID('silence-start-immediately').should('not.be.checked');
    // Allow for some difference in times
    cy.byTestID('silence-from').should('not.have.value', 'Now');
    cy.byTestID('silence-from').then(($fromElement) => {
      const fromText = $fromElement[0].getAttribute('value');
      expect(Date.parse(fromText) - Date.now()).toBeLessThan(10000);
      // eslint-disable-next-line promise/no-nesting
      cy.byTestID('silence-until').then(($untilElement) => {
        expect(Date.parse($untilElement[0].getAttribute('value')) - Date.parse(fromText)).toEqual(
          60 * 60 * 1000,
        );
      });
    });
    // Invalid start time
    cy.byTestID('silence-from').type('abc');
    cy.byTestID('silence-until').should('have.value', '-');
    // Change to back to start now
    cy.byTestID('silence-start-immediately').click();
    cy.byTestID('silence-start-immediately').should('be.checked');
    cy.byTestID('silence-until').should('have.value', '1h from now');
    // Change duration back again
    cy.byTestID('silence-for-toggle').click();
    cy.byTestID('silence-for').should('contain', '2h');
    cy.byTestID('silence-for')
      .contains(/^2h$/)
      .click();
    cy.byTestID('silence-until').should('have.value', '2h from now');
    // Add comment and submit
    cy.byTestID('silence-comment').type('test comment');
    cy.testA11y('Silence alert form');
    cy.get(submitButton).click();
    cy.get(errorMessage).should('not.exist');
    shouldBeWatchdogSilencePage();
    cy.testA11y('Silence details page');
    cy.log('shows the silenced Alert in the Silenced Alerts list');
    // Click the link to navigate back to the Alert details link
    cy.byTestID('firing-alerts')
      .first()
      .should('have.text', 'Watchdog')
      .click();
    shouldBeWatchdogAlertDetailsPage();

    cy.log('shows the newly created Silence in the Silenced By list');
    // Click the link to navigate back to the Silence details page
    cy.byLegacyTestID('silence-resource-link')
      .first()
      .should('have.text', 'Watchdog')
      .click();
    shouldBeWatchdogSilencePage();

    cy.log('expires the Silence');
    cy.byTestID('silence-actions-toggle').click();
    cy.byTestID('silence-actions').should('contain', 'Expire silence');
    cy.byTestID('silence-actions')
      .contains('Expire silence')
      .click();
    modal.shouldBeOpened();
    cy.testA11y('Expire silence modal');
    modal.submit();
    modal.shouldBeClosed();
    cy.get(errorMessage).should('not.exist');
    // Wait for expiredSilenceIcon to exist
    cy.byLegacyTestID('ban-icon').should('exist');
  });
});
