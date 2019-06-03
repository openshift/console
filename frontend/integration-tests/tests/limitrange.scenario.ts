import { browser, $$, ExpectedConditions as until } from 'protractor';
import { safeLoad } from 'js-yaml';
import { appHost, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';


describe('Limitrange test', () => {
  let defaultLimit = '';
  let defaultRequest = '';
  let type = '';
  it(`create limitrange resource for ${testName}`, async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/limitranges`);
    await crudView.createYAMLButton.click();
    await yamlView.isLoaded();
    const yamlContent = await yamlView.editorContent.getText();
    const content = safeLoad(yamlContent);
    for (const limitType of content.spec.limits){
      defaultLimit = limitType.default.memory;
      defaultRequest = limitType.defaultRequest.memory;
      type = limitType.type;
    }
    await crudView.saveChangesBtn.click();
    await browser.wait(until.presenceOf($$('.co-m-table-grid__head tr td').get(0)));
    const headers = $$('.co-m-table-grid__head td');
    const values = $$('.co-resource-list__item td');
    headers.then( items => {
      expect(items[0].getText()).toBe('TYPE');
      expect(items[1].getText()).toBe('RESOURCE');
      expect(items[2].getText()).toBe('MIN');
      expect(items[3].getText()).toBe('MAX');
      expect(items[4].getText()).toBe('DEFAULT REQUEST');
      expect(items[5].getText()).toBe('DEFAULT LIMIT');
      expect(items[6].getText()).toBe('MAX LIMIT/REQUEST RATIO');
    });
    values.then( items => {
      expect(items[0].getText()).toBe(type);
      expect(items[1].getText()).toBe('memory');
      expect(items[2].getText()).toBe('-');
      expect(items[3].getText()).toBe('-');
      expect(items[4].getText()).toBe(defaultRequest);
      expect(items[5].getText()).toBe(defaultLimit);
      expect(items[6].getText()).toBe('-');
    });

  });
});
