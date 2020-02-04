import {
  navigateToListView,
  listViewAction,
  waitForStatus,
  waitForSecondaryStatus,
  getResourceNameFromRow,
  getRowFilterLabels,
  confirmPowerOffAction,
  waitForSecondaryStatusRemoved,
  getProvisionedWorkerRows,
} from '../views/BareMetalHostsPage.view';
import { getResourceTitle } from '../views/common';
import {
  BMH_ACTION,
  BMH_PAGE_FILTERS,
  BMH_ACTION_TIMEOUT_PROVISION_DEPROVISION_CYCLE,
  BMH_ACTION_TIMEOUT_PROVISION,
} from '../const';
import { execSync } from 'child_process';

describe('Bare Metal Hosts page', () => {
  beforeAll(async () => {
    await navigateToListView();
  });

  it('displays the title', () => {
    const titleText = getResourceTitle();
    expect(titleText).toEqual('Bare Metal Hosts');
  });

  it('includes expected row filters', () => {
    const filterLabels = getRowFilterLabels();
    expect(filterLabels).toEqual(BMH_PAGE_FILTERS);
  });

  it('there is at least one provisioned worker', async () => {
    const workerRows = await getProvisionedWorkerRows();
    expect(workerRows.length).toBeGreaterThan(0);
  });
});

describe('Deprovision Bare Metal Host operation', () => {
  beforeAll(async () => {
    await navigateToListView();
  });

  it(
    'performs deprovision action on provisioned worker',
    async () => {
      const workerRow = getProvisionedWorkerRows().first();
      const workerName = await getResourceNameFromRow(workerRow);
      const action = BMH_ACTION.Deprovision;
      const confirmDialog = true;
      await listViewAction(workerName)(action, confirmDialog);
      await waitForStatus(workerName, 'Deprovisioning');
      await waitForStatus(workerName, 'Available');

      execSync(`oc scale --replicas=3 machineset ostest-worker-0 -n openshift-machine-api`);
      await waitForStatus(workerName, 'Provisioning');
      await waitForStatus(workerName, 'Provisioned', BMH_ACTION_TIMEOUT_PROVISION);
    },
    BMH_ACTION_TIMEOUT_PROVISION_DEPROVISION_CYCLE,
  );
});

describe('Bare Metal Host power operations', () => {
  let hostName;
  beforeAll(async () => {
    await navigateToListView();
    const row = getProvisionedWorkerRows().first();
    hostName = await getResourceNameFromRow(row);
  });

  it('performs power off action', async () => {
    await listViewAction(hostName)(BMH_ACTION.PowerOff, false);
    await confirmPowerOffAction();
    await waitForSecondaryStatus(hostName, 'Powering off');
    await waitForSecondaryStatus(hostName, 'Powered off');
  });

  it('performs power on action', async () => {
    await listViewAction(hostName)(BMH_ACTION.PowerOn);
    await waitForSecondaryStatus(hostName, 'Powering on');
    await waitForSecondaryStatusRemoved(hostName);
  });
});
