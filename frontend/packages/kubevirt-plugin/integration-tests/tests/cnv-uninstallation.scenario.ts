import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { $, browser, by, element } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';

const namespaceButton = $('.co-namespace-selector button');
const openshiftNamespaceButton = $('#openshift-cnv-link');
 
describe('Uninstall Kubevirt', () => {
 
  beforeAll(async () => {
    await sidenavView.clickNavLink(['Operators', 'Installed Operators']);
    await isLoaded();
    await click(namespaceButton);
    await click(openshiftNamespaceButton);
  });
 
  it('Uninstall Kubevirt', async () => {
    await isLoaded();
    element(by.xpath("//button[@data-test-id='kebab-button']")).click();
    await browser.sleep(1000);
    element(by.xpath("//button[@data-test-action='Uninstall Operator']")).click();
    await browser.sleep(1000);
    element(by.id('confirm-action')).click();
  })
 })