import * as cnvView from '../views/containerNativeVirtualization.view';
import { click } from '@console/shared/src/test-utils/utils';
import { browser, by, element } from 'protractor';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';

describe('Kubevirt Installation', () => {
 
  beforeAll(async () => {
    await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
    await isLoaded();
    await click(cnvView.namespaceButton);
    await click(cnvView.openshiftNamespaceButton);
  });
 
  it('Install Kubevirt', async () => {
    await isLoaded();
    element(by.cssContainingText('.catalog-tile-pf-title', 'Container-native virtualization Operator')).click();
    element(by.linkText('Install')).click()
    await browser.sleep(20000);  
  })
 })
 