import { browser, $, by, ExpectedConditions as until, element } from 'protractor';
import { appHost, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as olmCatalogView from '../../views/olm-catalog.view';
import * as crdView from '../../views/crd.view';

describe('Test for CRD related pages', () => {

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('View instances list of crd/catalogsource', async() => {
    browser.get(`${appHost}/k8s/cluster/customresourcedefinitions`);
    await browser.wait(until.presenceOf(crdView.resourceListLogoCRD));
    await crudView.clickResourceNameLink('CatalogSource');
    await crudView.clickDetailsPageAction('View Instances');
    await browser.wait(until.presenceOf(olmCatalogView.entryRows.get(0)));
    expect(olmCatalogView.entryRows.count()).toBeGreaterThan(0);
  });

  it('Check catalogsource instance without OperatorGroup has correct message', async() => {
    await crudView.clickResourceNameLink('certified-operators');
    await browser.wait(until.presenceOf(element(by.cssContainingText('.cos-status-box__title', 'Namespace Not Enabled'))));
    expect($('.cos-status-box__detail').getText()).toContain('not configured with an OperatorGroup');
    expect(element(by.partialLinkText('Create one here')).isPresent()).toBe(true);
  });

  it('Check catalogsource instance with OperatorGroup displays well', async() => {
    await browser.navigate().back();
    await crudView.clickResourceNameLink('olm-operators');
    await browser.wait(until.textToBePresentInElement($('.co-catalogsource-list__section__packages'), 'OLM Operators'));
    expect($('.co-clusterserviceversion-logo__name__clusterserviceversion').getText()).toContain('Package Server');
    expect(element(by.partialLinkText('View')).isPresent()).toBe(true);
  });

});
