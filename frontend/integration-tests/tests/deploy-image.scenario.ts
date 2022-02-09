import { browser, element, by, ExpectedConditions as until } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';

describe('Deploy Image', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  const imageName = 'mysql';

  describe('Deploy Image page', () => {
    it('should render project/namespace dropdown disabled when in a project context', async () => {
      // Navigate to the deploy-image page
      await browser.get(`${appHost}/deploy-image/ns/${testName}?preselected-ns=${testName}`);

      const dropdown = '[data-test-id=namespace-bar-dropdown] > *:nth-child(1) button:disabled';
      // Wait for the Project dropdown to appear
      await browser.wait(until.presenceOf(element(by.css(dropdown))));
      // Confirm that the project dropdown text matches project context
      expect(element(by.css(dropdown)).getText()).toEqual(`Project: ${testName}`);
    });

    it('should render applications dropdown disabled', async () => {
      const dropdown = '[data-test-id=namespace-bar-dropdown] > *:nth-child(2) button:disabled';
      // Wait for the Applications dropdown to appear
      await browser.wait(until.presenceOf(element(by.css(dropdown))));
      // Confirm that the application dropdown is unset
      expect(element(by.css(dropdown)).getText()).toEqual('Application: All applications');
    });

    it('can be used to search for an image', async () => {
      // Put the search term in the search field
      await element(by.css('[data-test-id=deploy-image-search-term]')).sendKeys(imageName);

      //remove focus form image search field
      await element(by.css('[data-test-id=application-form-app-name]')).click();

      const helperText = 'form-input-searchTerm-field-helper';
      // Wait for the validation
      await browser.wait(
        until.presenceOf(element(by.css('.pf-m-success[data-test-id=deploy-image-search-term]'))),
      );
      await browser.wait(until.presenceOf(element(by.id(helperText))));
      // Confirm the results appeared
      expect(element(by.id(helperText)).getText()).toEqual('Validated');
    });

    it('should auto fill in the application', async () => {
      await browser.wait(until.presenceOf(element(by.id('form-input-application-name-field'))));
      // Confirm that a node is present in the topology
      expect(element(by.id('form-input-application-name-field')).getAttribute('value')).toEqual(
        `${imageName}-app`,
      );
    });

    xit('should deploy the image and display it in the topology', async () => {
      // Deploy the image
      // Wait until the button is active
      await browser.wait(
        until.elementToBeClickable(
          element(by.css('[data-test-id="deploy-image-form-submit-btn"]')),
        ),
      );
      // Click the Deploy button now that the Search is done
      await element(by.css('[data-test-id="deploy-image-form-submit-btn"]')).click();
      // Wait for topology
      await browser.wait(until.presenceOf(element(by.css('[data-test-id=topology]'))));
      // Find all workload nodes in the topology
      const nodes = element.all(
        by.css('[data-test-id=topology] [data-kind=node][data-type=workload]'),
      );
      // Get the text of each node to match against the image name
      let found = false;
      nodes.each(async (n) => {
        const text = await n.getText();
        if (text.includes(imageName)) {
          found = true;
        }
      });
      expect(found);
    });
  });
});
