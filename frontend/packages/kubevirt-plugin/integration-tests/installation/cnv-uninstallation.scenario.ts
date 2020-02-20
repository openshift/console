import { click } from '@console/shared/src/test-utils/utils';
import { browser } from 'protractor';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';
import * as cnvView from '../views/containerNativeVirtualization.view';
import { confirmAction } from '../views/vm.actions.view';
import { waitFor } from '../tests/utils/utils';
import { execSync } from 'child_process';
import * as crudView from '@console/internal-integration-tests/views/crud.view';

describe('Uninstall Kubevirt', () => {
  beforeAll(async () => {
    await sidenavView.clickNavLink(['Operators', 'Installed Operators']);
    await isLoaded();
    await click(cnvView.namespaceButton);
    await click(cnvView.openshiftNamespaceButton);
  });

  it('Deleting the KubeVirt HyperConverged Operator Custom Resource', async () => {
    await isLoaded();
    await cnvView.elmKebab.click();
    await isLoaded();
    await cnvView.elmUninstall.click();
    await waitFor(cnvView.kubevirtOperatorStatus, 'Succeeded', 5);
    await confirmAction();
  });

  it('Deleting the Container-native virtualization catalog subscription', async () => {
    await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
    await isLoaded();
    await cnvView.elmCNV.click();
    await browser.sleep(20000);
  });

  it('Delete the openshift-cnv project', async () => {
    await sidenavView.clickNavLink(['Administration', 'Namespaces']);
    await cnvView.nameFilter.sendKeys("openshift-cnv")
    await crudView.isLoaded();
    await crudView.clickKebabAction("openshift-cnv", "Delete Namespace");
    await crudView.isLoaded();
    await cnvView.verifyDelete.sendKeys("openshift-cnv")
    await crudView.isLoaded();
    await confirmAction();
  });

  it('Verify all CNV related resources are gone', async () => {
    execSync('kubectl delete apiservices v1alpha3.subresources.kubevirt.io -n openshift-cnv');
  });
});
