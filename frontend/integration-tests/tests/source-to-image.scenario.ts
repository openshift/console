/* eslint-disable no-undef, no-unused-vars */

import { browser, $, element, by, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';

import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as sourceToImageView from '../views/source-to-image.view';

describe('Source-to-Image', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  describe('Image stream page', () => {
    it('has Create Application button for builder image', async() => {
      await sourceToImageView.visitOpenShiftImageStream('nodejs');
      expect(sourceToImageView.createApplicationButton.isPresent()).toBe(true);
    });

    it('does not have Create Application button for non-builder image', async() => {
      await sourceToImageView.visitOpenShiftImageStream('jenkins');
      expect(sourceToImageView.createApplicationButton.isPresent()).toBe(false);
    });
  });

  describe('Node.js app', () => {
    const appName = 'test-nodejs';
    const appLabel = `app=${appName}`;
    const resources = {
      'buildconfigs': {kind: 'BuildConfig'},
      'deploymentconfigs': {kind: 'DeploymentConfig'},
      'imagestreams': {kind: 'ImageStream'},
      'routes': {kind: 'Route'},
      'services': {kind: 'Service'},
    };

    const visitResource = async(resource: string) => {
      await browser.get(`${appHost}/k8s/ns/${testName}/${resource}/${appName}`);
    };

    const deleteResource = async(resource: string, kind: string) => {
      await visitResource(resource);
      await crudView.isLoaded();
      await crudView.actionsDropdown.click();
      await browser.wait(until.presenceOf(crudView.actionsDropdownMenu), 500);
      await crudView.actionsDropdownMenu.element(by.partialLinkText('Delete ')).click();
      await browser.wait(until.presenceOf($('#confirm-action')));
      await $('#confirm-action').click();
    };

    beforeAll(async() => {
      await sourceToImageView.visitOpenShiftImageStream('nodejs');
      await sourceToImageView.createApplicationButton.click();
      await sourceToImageView.isLoaded();
      await sourceToImageView.selectTestProject();
      await sourceToImageView.nameInput.sendKeys(appName);
      await sourceToImageView.trySampleButton.click();
      await sourceToImageView.routeCheckbox.click();
      await sourceToImageView.submitButton.click();
      // Wait until we're redirected to the deployment config page.
      await browser.wait(until.presenceOf(crudView.actionsDropdown));
    });

    afterAll(async() => {
      for (const resource in resources) {
        if (resources.hasOwnProperty(resource)) {
          const { kind } = resources[resource];
          await deleteResource(resource, kind);
        }
      }
    });

    _.each(resources, ({kind}, resource) => {
      it(`creates a ${kind}`, async() => {
        await visitResource(resource);
        await crudView.isLoaded();
        await browser.wait(until.presenceOf(crudView.actionsDropdown));
        expect(crudView.resourceTitle.getText()).toEqual(appName);
        expect(element(by.cssContainingText('.co-m-label', appLabel)).isPresent()).toBe(true);
      });
    });
  });
});
