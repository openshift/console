import { click } from '@console/shared/src/test-utils/utils';
import { browser } from 'protractor';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import * as cnvView from '../views/containerNativeVirtualization.view';
import { confirmAction } from '../views/vm.actions.view';
import { waitFor } from '../tests/utils/utils';
import { execSync } from 'child_process';
import * as crudView from '@console/internal-integration-tests/views/crud.view';

describe('Uninstall Kubevirt', () => {
  beforeAll(async () => {
    await clickNavLink(['Operators', 'Installed Operators']);
    await crudView.isLoaded();
    await click(cnvView.namespaceButton);
    await click(cnvView.openshiftNamespaceButton);
  });

  it('Deleting the KubeVirt HyperConverged Operator Custom Resource', async () => {
    await crudView.isLoaded();
    await cnvView.elmKebab.click();
    await crudView.isLoaded();
    await cnvView.elmUninstall.click();
    await waitFor(cnvView.kubevirtOperatorStatus, 'Succeeded', 5);
    await confirmAction();
  });

  it('Deleting the Container-native virtualization catalog subscription', async () => {
    await clickNavLink(['Operators', 'OperatorHub']);
    await crudView.isLoaded();
    await cnvView.elmCNV.click();
    await browser.sleep(20000);
  });

  it('Delete the openshift-cnv project', async () => {
    await clickNavLink(['Administration', 'Namespaces']);
    await cnvView.nameFilter.sendKeys('openshift-cnv');
    await crudView.isLoaded();
    await crudView.clickKebabAction('openshift-cnv', 'Delete Namespace');
    await crudView.isLoaded();
    await cnvView.verifyDelete.sendKeys('openshift-cnv');
    await crudView.isLoaded();
    await confirmAction();
  });

  it('Delete kubevirt.io apiservices', async () => {
    execSync('kubectl delete apiservices v1alpha3.subresources.kubevirt.io -n openshift-cnv');
  });
});
