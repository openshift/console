import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { $, browser, by, element } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';

const namespaceButton = $('.co-namespace-selector button');
const openshiftNamespaceButton = $('#openshift-cnv-link');

 
describe('Go to operators page', () => {
 
  beforeAll(async () => {
    await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
    await isLoaded();
    await click(namespaceButton);
    await click(openshiftNamespaceButton);
  });
 
  it('install Kubevirt', async () => {
    await isLoaded();
    element(by.cssContainingText('.catalog-tile-pf-title', 'Container-native virtualization Operator')).click();
    element(by.linkText('Install')).click()
    await browser.sleep(20000);  
  })
 })