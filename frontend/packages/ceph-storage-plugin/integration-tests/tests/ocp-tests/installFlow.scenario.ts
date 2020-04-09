import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import {
  MINUTE,
  SECOND,
  NS,
  OCS_NODE_LABEL,
  STORAGE_CLUSTER_NAME,
  CATALOG_SRC,
} from '../../utils/consts';
import {
  selectWorkerRows,
  InstallCluster,
  ocsOperator,
  createLink,
  sizeDropdown,
  optionSmallSize,
  primaryButton,
} from '../../views/installFlow.view';
import { getStorageClusterLink } from '../../views/add-capacity.view';
import { hasTaints, hasOCSTaint, refreshIfNotVisible } from '../../utils/helpers';

const Installer = new InstallCluster(NS);

const testNodeLabel = (node) => {
  const nodeJSON = JSON.parse(execSync(`kubectl get nodes ${node} -o json`).toString());
  const labelKeys = Object.keys(nodeJSON.metadata.labels);
  expect(labelKeys).toContain(OCS_NODE_LABEL);
  expect(hasOCSTaint(nodeJSON) || !hasTaints(nodeJSON)).toBe(true);
};

xdescribe('Testing OCS Cluster Creation', () => {
  beforeAll(async () => {
    await Installer.createNamespace();
    expect(browser.getCurrentUrl()).toContain(NS);
    await Installer.subscribeToOperator(CATALOG_SRC);
    await click(ocsOperator);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    // This can fail in a fresh cluster
    try {
      await browser.wait(until.visibilityOf(createLink), 10 * SECOND);
    } catch {
      await refreshIfNotVisible(createLink, 5);
    }
    const storageClusterLink = await getStorageClusterLink();
    await click(storageClusterLink);
  }, 3 * MINUTE);

  it(
    'Test Storage Cluster Creation',
    async () => {
      await browser.wait(until.and(crudView.untilNoLoadersPresent));
      // Node list fluctuates
      await browser.sleep(5 * SECOND);
      const nodes = await selectWorkerRows();
      await click(sizeDropdown);
      await click(optionSmallSize);
      await browser.wait(until.elementToBeClickable(primaryButton));
      await click(primaryButton);
      await browser.wait(until.and(crudView.untilNoLoadersPresent));
      // eslint-disable-next-line no-useless-escape
      const defaultSC = execSync(`kubectl get storageclasses | grep -Po '\\w+(?=.*default)'`)
        .toString()
        .trim();
      const storageCR = JSON.parse(
        execSync(`kubectl get storageclusters ${STORAGE_CLUSTER_NAME} -n ${NS} -o json`).toString(),
      );
      const scFromYAML =
        storageCR?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec?.storageClassName;
      const size =
        storageCR?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec?.resources?.requests
          ?.storage;
      expect(defaultSC).toEqual(scFromYAML);
      // Tests for storage class
      expect(size).toEqual('512Gi');
      nodes.forEach((node, i) => testNodeLabel(nodes[i]));
    },
    5 * MINUTE,
  );
});
