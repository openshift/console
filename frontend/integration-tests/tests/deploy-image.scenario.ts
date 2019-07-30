import { browser, $, element, by, ExpectedConditions as until } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';

describe('Deploy Image', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  const appName = 'myapp';
  const imageName = 'mysql';

  describe('Deploy Image page', () => {
    it('should render project/namespace dropdown when all-namespace is selected', async() => {
      // Navigate to the deploy-image page
      await browser.get(`${appHost}/deploy-image/all-namespaces`);

      const nsSpan =
        '#form-ns-dropdown-project-name-field .btn-dropdown__content-wrap .pf-c-dropdown__toggle-text .pf-c-dropdown__toggle-text--placeholder';
      // Wait for the Project field to appear
      await browser.wait(until.presenceOf(element(by.css(nsSpan))));
      // Confirm that the project field has the right text
      expect(element(by.css(nsSpan)).getText()).toEqual('Select namespace');
    });

    it('should render project/namespace dropdown disabled when in a project context', async() => {
      // Navigate to the deploy-image page
      await browser.get(`${appHost}/deploy-image/ns/${testName}?preselected-ns=${testName}`);

      const nsSpan =
        '#form-ns-dropdown-project-name-field .btn-dropdown__content-wrap .pf-c-dropdown__toggle-text .co-resource-item .co-resource-item__resource-name';
      // Wait for the Project field to appear
      await browser.wait(until.presenceOf(element(by.css(nsSpan))));
      // Confirm that the project field does not exist
      expect(element(by.css(nsSpan)).getText()).toEqual(testName);
    });

    it('can be used to search for an image', async() => {
      // Put the search term in the search field
      await element(by.css('[data-test-id="deploy-image-search-term"]')).sendKeys(imageName);
      // Click the search button
      await element(by.css('[data-test-id="input-search-field-btn"]')).click();
      // Wait for the results section to appear
      await browser.wait(until.presenceOf($('.co-image-name-results__details')));
      // Confirm the results appeared
      expect(
        element(by.cssContainingText('.co-image-name-results__heading', imageName)).isPresent(),
      ).toBe(true);
    });

    it('should fill in the application', async() => {
      // Set the application name
      // Wait for the Application Dropdown field to appear
      await browser.wait(
        until.elementToBeClickable(element(by.id('form-dropdown-application-name-field'))),
      );
      // Click on the dropdown
      await element(by.id('form-dropdown-application-name-field')).click();
      // Wait for the Create Application button to appear
      await browser.wait(until.presenceOf(element(by.id('#CREATE_APPLICATION_KEY#-link'))));
      // Click on the Create New Application button
      await element(by.id('#CREATE_APPLICATION_KEY#-link')).click();
      // Wait for the Application Name field to appear
      await browser.wait(until.presenceOf(element(by.id('form-input-application-name-field'))));
      // Enter the new Application name
      await element(by.id('form-input-application-name-field')).sendKeys(appName);
      // Confirm that a node is present in the topology
      expect(element(by.id('form-input-application-name-field')).getAttribute('value')).toEqual(
        appName,
      );
    });

    it('should deploy the image and display it in the topology', async() => {
      // Deploy the image
      // Wait until the button is active
      await browser.wait(
        until.elementToBeClickable(
          element(by.css('[data-test-id="deploy-image-form-submit-btn"]')),
        ),
      );
      // Click the Deploy button now that the Search is done
      await element(by.css('[data-test-id="deploy-image-form-submit-btn"]')).click();
      // Wait to be redirected to the Topology view
      await browser.wait(until.presenceOf(element(by.css('.odc-graph'))));
      // Confirm that a node is present in the topology
      expect(element.all(by.css('.odc-base-node__bg')).isPresent());
    });
  });
});
