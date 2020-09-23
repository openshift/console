import { checkErrors, testName } from '../../support';
import { submitButton, errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { detailsPage } from '../../views/details-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

const shouldBeWatchdogAlertDetailsPage = () => {
  cy.byTestID('resource-title').contains('Watchdog');
  detailsPage.sectionHeaderShouldExist('Alert Details');
  detailsPage.labelShouldExist('alertname=Watchdog');
};

const shouldBeWatchdogAlertRulesPage = () => {
  cy.byTestID('resource-title').contains('Watchdog');
  detailsPage.sectionHeaderShouldExist('Alerting Rule Details');
  detailsPage.sectionHeaderShouldExist('Active Alerts');
};

const shouldBeWatchdogSilencePage = () => {
  cy.byTestID('resource-title').contains('Watchdog');
  detailsPage.sectionHeaderShouldExist('Silence Details');
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
    cy.log('use sidebar nav to goto Monitoring -> Alerting');
    nav.sidenav.clickNavLink(['Monitoring', 'Alerting']);
    // TODO, switch to 'listPage.titleShouldHaveText('Alerting');', when we switch to new test id
    cy.byLegacyTestID('resource-title').should('have.text', 'Alerting');
    listPage.projectDropdownShouldNotExist();
    listPage.rows.shouldBeLoaded();
    cy.testA11y('Monitor Alerting list page');

    cy.log('filter Alerts');
    listPage.filter.byName('Watchdog');
    listPage.rows.countShouldBe(1);

    cy.log('drills down to Alert details page');
    listPage.rows.shouldExist('Watchdog').click();
    shouldBeWatchdogAlertDetailsPage();
    cy.testA11y('Alerting details page');

    cy.log('drill down to the Alerting Rule details page');
    cy.byTestID('alert-rules-detail-resource-link')
      .contains('Watchdog')
      .click();
    shouldBeWatchdogAlertRulesPage();
    cy.testA11y('Alerting Rule details page');

    cy.log('drill back up to the Alert details page');
    // Active Alerts list should contain a link back to the Alert details page
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
    detailsPage.clickPageActionButton('Silence Alert');
    // launches page form
    cy.byTestID('start-immediately').should('be.checked');
    cy.byTestID('from').should('have.value', 'Now');
    cy.byLegacyTestID('dropdown-button').should('contain', '2h');
    cy.byTestID('until').should('have.value', '2h from now');
    // Change duration
    cy.byLegacyTestID('dropdown-button')
      .click()
      .get('[data-test-dropdown-menu="1h"]')
      .click();
    cy.byTestID('until').should('have.value', '1h from now');
    // Change to not start now
    cy.byTestID('start-immediately').click();
    cy.byTestID('start-immediately').should('not.be.checked');
    // Allow for some difference in times
    cy.byTestID('from').should('not.have.value', 'Now');
    cy.byTestID('from').then(($fromElement) => {
      const fromText = $fromElement[0].getAttribute('value');
      expect(Date.parse(fromText) - Date.now()).toBeLessThan(10000);
      // eslint-disable-next-line promise/no-nesting
      cy.byTestID('until').then(($untilElement) => {
        expect(Date.parse($untilElement[0].getAttribute('value')) - Date.parse(fromText)).toEqual(
          60 * 60 * 1000,
        );
      });
    });
    // Invalid start time
    cy.byTestID('from').type('abc');
    cy.byTestID('until').should('have.value', '-');
    // Change to back to start now
    cy.byTestID('start-immediately').click();
    cy.byTestID('start-immediately').should('be.checked');
    cy.byTestID('until').should('have.value', '1h from now');
    // Change duration back again
    cy.byLegacyTestID('dropdown-button')
      .click()
      .get('[data-test-dropdown-menu="2h"]')
      .click();
    cy.byTestID('until').should('have.value', '2h from now');
    // add comment and submit
    cy.byTestID('silence-comment').type('test comment');
    cy.testA11y('Silence Alert form');
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
    detailsPage.clickPageActionFromDropdown('Expire Silence');
    modal.shouldBeOpened();
    cy.testA11y('Expire Silence modal');
    modal.submit();
    modal.shouldBeClosed();
    cy.get(errorMessage).should('not.exist');
    // wait for expiredSilenceIcon to exist
    cy.byLegacyTestID('ban-icon').should('exist');
  });
});
