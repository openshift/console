import { browser, $, $$, by, ExpectedConditions as until, Key, element } from 'protractor';
import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';




describe('Test for CRD related pages', () => {


  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('Check CatalogSource instances', async() => {
    browser.get(`${appHost}/k8s/cluster/customresourcedefinitions`);
    await browser.wait(until.presenceOf($('.ReactVirtualized__Grid__innerScrollContainer')));

    console.log("############ check CRD CatalogSource ########")
    var cs = element(by.linkText('CatalogSource'));
  	expect(cs.getAttribute('href')).toContain('catalogsources.operators.coreos.com');
  	await cs.click()

    console.log("############ go to instances page from CRD page ########")
    await browser.wait(until.presenceOf($('.btn-dropdown__item')));
  	await $('.btn-dropdown__item').click()
  	var viewInstance = element(by.xpath('//a[contains(text(),"View Instances")]'));
  	await viewInstance.click()

  	console.log("############ check instances ########")
  	browser.sleep('5000');
    expect($$('.ReactVirtualized__Grid__innerScrollContainer .co-m-row').count()).toBeGreaterThan(0);
    browser.sleep('10000');

  });

  it('Check CatalogSource instances without OperatorGroup - certified-operators', async() => {
    browser.get(`${appHost}/k8s/ns/openshift-marketplace/operators.coreos.com~v1alpha1~CatalogSource/certified-operators`);
  //  await browser.wait(until.presenceOf($('.ReactVirtualized__Grid__innerScrollContainer')));



  });


  it('Check CatalogSource instances without OperatorGroup - olm-operators', async() => {
    browser.get(`${appHost}/k8s/ns/openshift-operator-lifecycle-manager/operators.coreos.com~v1alpha1~CatalogSource/olm-operators`);
  //  await browser.wait(until.presenceOf($('.ReactVirtualized__Grid__innerScrollContainer')));



  });


});
