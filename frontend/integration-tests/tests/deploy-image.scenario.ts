/* eslint-disable no-undef, no-unused-vars */

import { browser, $, element, by, ExpectedConditions as until, Key } from 'protractor';
import * as _ from 'lodash';

import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';

describe('Deploy Image', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  const appName = 'mysql';

  describe('Deployment Configs page', () => {
    it('has Create button', async() => {
      await browser.get(`${appHost}/k8s/ns/${testName}/deploymentconfigs`);
      await crudView.isLoaded();
      expect((element(by.buttonText('Create'))).isPresent()).toBe(true);
    });

    it('can be used to navigate to the Deploy Image page', async() => {
      await $('#item-create').click().then(() => browser.actions().sendKeys(Key.ARROW_DOWN, Key.ENTER).perform());
      await browser.wait(until.presenceOf($('.co-deploy-image')));
      expect((element(by.cssContainingText('#resource-title', 'Deploy Image'))).isPresent()).toBe(true);
    });
  });

  describe('Deploy Image page', () => {
    it('can be used to search for an image', async() => {
      await $('#image-name').sendKeys(appName);
      await $('.input-group-btn .btn-default').click();
      await browser.wait(until.presenceOf($('.co-image-name-results__details')));
      expect((element(by.cssContainingText('.co-image-name-results__heading', appName))).isPresent()).toBe(true);
    });

    it('can be used to create an app based on an image', async() => {
      await $('.co-m-btn-bar .btn-primary').click();
      await browser.wait(until.presenceOf($('.overview')));
      expect($('.co-m-pane__name').getText()).toEqual('Project Status');
      await browser.get(`${appHost}/k8s/ns/${testName}/deploymentconfigs/${appName}`);
      await browser.wait(until.presenceOf(crudView.actionsDropdown));
      expect(browser.getCurrentUrl()).toContain(`/${appName}`);
      expect(crudView.resourceTitle.getText()).toEqual(appName);
    });
  });

  describe('Deploy Image app', () => {
    const resources = {
      'deploymentconfigs': {kind: 'DeploymentConfig'},
      'imagestreams': {kind: 'ImageStream'},
      'services': {kind: 'Service'},
    };

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
