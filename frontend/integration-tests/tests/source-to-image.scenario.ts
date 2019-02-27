/* eslint-disable no-undef, no-unused-vars */

import { $, browser, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';

import { checkLogs, checkErrors } from '../protractor.conf';
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

  // Disabling for now due to flake https://jira.coreos.com/browse/CONSOLE-1293
  xdescribe('CONSOLE-1293 - Node.js app', () => {
    const appName = 'test-nodejs';
    const resources = {
      'buildconfigs': {kind: 'BuildConfig'},
      'deploymentconfigs': {kind: 'DeploymentConfig'},
      'imagestreams': {kind: 'ImageStream'},
      'routes': {kind: 'Route'},
      'services': {kind: 'Service'},
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
      // Wait until we're redirected to the overview page.
      await browser.wait(until.presenceOf($('.overview')));
    });

    afterAll(async() => {
      for (const resource in resources) {
        if (resources.hasOwnProperty(resource)) {
          const { kind } = resources[resource];
          await crudView.deleteResource(resource, kind, appName);
        }
      }
    });

    _.each(resources, ({kind}, resource) => {
      it(`displays detail view for new ${kind} instance`, async() => {
        crudView.checkResourceExists(resource, appName);
      });
    });
  });
});
