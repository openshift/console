/* eslint-disable no-console */

import { browser, $, $$, ExpectedConditions as until, Key } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { execSync } from 'child_process';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';

describe('Kubernetes resource CRUD operations', () => {
  const leakedResources = new Set<string>();

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    const leakedArray: Array<string> = [...leakedResources];
    if (!_.isEmpty(leakedArray)) {
      console.error(`Leaked ${leakedArray.length} resources\n${leakedArray.join('\n')}.`);
    } else {
      console.log('No resources leaked.');
    }

    leakedArray
      .map((r) => JSON.parse(r) as { name: string; plural: string; namespace?: string })
      .filter((r) => r.namespace === undefined)
      .forEach(({ name, plural }) => {
        try {
          execSync(`kubectl delete --cascade ${plural} ${name}`);
        } catch (error) {
          console.error(`Failed to delete ${plural} ${name}:\n${error}`);
        }
      });
  });

  describe('Editing labels', () => {
    const name = `${testName}-editlabels`;
    const plural = 'configmaps';
    const kind = 'ConfigMap';
    const labelValue = 'appblah';

    beforeAll(async () => {
      await browser.get(`${appHost}/k8s/ns/${testName}/${plural}/~new`);
      await yamlView.isLoaded();
      const content = await yamlView.getEditorContent();
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name, namespace: testName } },
        safeLoad(content),
      );
      await yamlView.setEditorContent(safeDump(newContent));
      leakedResources.add(JSON.stringify({ name, plural, namespace: testName }));
      await yamlView.saveButton.click();
    });

    it('displays modal for editing resource instance labels', async () => {
      await crudView.clickDetailsPageAction(crudView.actions.labels);
      await browser.wait(until.presenceOf($('.tags input')));
      await $('.tags input').sendKeys(labelValue, Key.ENTER);
      // This only works because there's only one label
      await browser.wait(until.textToBePresentInElement($('.tags .tag-item'), labelValue), 1000);
      await $('.modal-footer #confirm-action').click();
    });

    it('updates the resource instance labels', async () => {
      await browser.wait(until.presenceOf($('.co-m-label.co-m-label--expand')));
      expect(
        $$('.co-m-label__key')
          .first()
          .getText(),
      ).toEqual(labelValue);
    });

    it('sees if label links still work', async () => {
      await $$('.co-m-label')
        .first()
        .click();
      await browser.wait(
        until.urlContains(`/search/ns/${testName}?kind=core~v1~ConfigMap&q=${labelValue}`),
      );

      expect($('.pf-c-chip__text').isDisplayed()).toBe(true);
    });

    afterAll(async () => {
      await crudView.deleteResource(plural, kind, name);
      leakedResources.delete(JSON.stringify({ name, plural, namespace: testName }));
    });
  });
});
