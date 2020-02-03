import * as cnvView from '../views/containerNativeVirtualization.view';
import { click } from '@console/shared/src/test-utils/utils';
import { browser, by, element } from 'protractor';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';

import { waitFor } from './utils/utils';

describe('Uninstall Kubevirt', () => {
 
  beforeAll(async () => {
    await sidenavView.clickNavLink(['Operators', 'Installed Operators']);
    await isLoaded();
    await click(cnvView.namespaceButton);
    await click(cnvView.openshiftNamespaceButton);
  });
 
  it('Uninstall Kubevirt', async () => {
    await isLoaded();
    element(by.xpath("//button[@data-test-id='kebab-button']")).click();
    await browser.sleep(1000);
    element(by.xpath("//button[@data-test-action='Uninstall Operator']")).click();
    await waitFor(cnvView.kubevirtOperatorStatus, 'Succeeded', 5);
    element(by.id('confirm-action')).click();
  })
 })
