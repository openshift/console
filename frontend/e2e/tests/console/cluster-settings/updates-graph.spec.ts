import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';

const CLUSTER_VERSION_URL = '**/apis/config.openshift.io/v1/clusterversions/version';

// Create a mock with both desired channels and available updates
const clusterVersionWithGraphData = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    creationTimestamp: '2024-01-04T05:14:57Z',
    generation: 4,
    name: 'version',
    resourceVersion: '370626',
    uid: '40b1ad1b-13d2-4c7c-932a-ce78c4447ed8',
  },
  spec: {
    channel: 'stable-4.16',
    clusterID: '4976480a-15e1-4c94-bafe-aafb96bc0248',
    upstream: 'https://openshift-release.apps.ci.l2s4.p1.openshiftapps.com/graph',
  },
  status: {
    availableUpdates: [
      {
        image:
          'registry.ci.openshift.org/ocp/release@sha256:f31d5b0e23c8f978b57f5ef74c8811e7f87103187aa1895880f67eac4eb76f6d',
        version: '4.16.1',
      },
      {
        image:
          'registry.ci.openshift.org/ocp/release@sha256:f31d5b0e23c8f978b57f5ef74c8811e7f87103187aa1895880f67eac4eb76f6e',
        version: '4.16.2',
      },
      {
        image:
          'registry.ci.openshift.org/ocp/release@sha256:06cd433ae0036e3b79e2ecd08512abca540fbefe9805b225a6a9c33ca9456ad3',
        version: '4.17.0',
      },
    ],
    conditions: [
      {
        lastTransitionTime: '2024-01-04T05:37:10Z',
        status: 'True',
        type: 'RetrievedUpdates',
      },
      {
        lastTransitionTime: '2024-01-04T05:35:14Z',
        message: 'Done applying 4.16.0',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2024-01-04T05:35:14Z',
        status: 'False',
        type: 'Failing',
      },
      {
        lastTransitionTime: '2024-01-04T05:35:14Z',
        message: 'Cluster version is 4.16.0',
        status: 'False',
        type: 'Progressing',
      },
    ],
    desired: {
      channels: [
        'stable-4.16',
        'candidate-4.16',
        'fast-4.16',
        'stable-4.17',
        'candidate-4.17',
        'fast-4.17',
      ],
      image:
        'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
      version: '4.16.0',
    },
    history: [
      {
        completionTime: '2024-01-04T05:35:14Z',
        image:
          'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
        startedTime: '2024-01-04T05:15:00Z',
        state: 'Completed',
        verified: false,
        version: '4.16.0',
      },
    ],
    observedGeneration: 3,
    versionHash: 'rqBs61ZyVwQ=',
  },
};

test.describe('Cluster Settings updates graph', { tag: ['@admin'] }, () => {
  test('displays updates graph with available updates across channels', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    await test.step('Setup: Mock cluster version with graph data', async () => {
      await page.route(CLUSTER_VERSION_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clusterVersionWithGraphData),
        });
      });
    });

    await test.step('Navigate to Cluster Settings', async () => {
      await clusterSettings.navigateToDetails();
    });

    await test.step('Verify updates graph is displayed', async () => {
      const updatesGraph = page.getByTestId('cv-updates-graph');
      await expect(updatesGraph).toBeVisible();
    });

    await test.step('Verify channel sections are displayed', async () => {
      const channels = page.getByTestId('cv-channel');
      await expect(channels).toHaveCount(2);
    });

    await test.step('Verify first channel (stable-4.16) details', async () => {
      const firstChannel = page.getByTestId('cv-channel').first();
      const firstChannelName = page.getByTestId('cv-channel-name').first();

      // Verify channel name
      await expect(firstChannelName).toContainText('stable-4.16 channel');

      // Verify version dots and versions
      const versionDots = firstChannel.getByTestId('cv-channel-version-dot');
      await expect(versionDots).toHaveCount(2);

      const versions = firstChannel.getByTestId('cv-channel-version');
      await expect(versions).toHaveCount(2);
    });

    await test.step('Open and close "Other available paths" modal', async () => {
      const firstChannel = page.getByTestId('cv-channel').first();
      const moreUpdatesButton = firstChannel.getByTestId('cv-more-updates-button');

      // Click "More updates" button
      await expect(moreUpdatesButton).toBeVisible();
      await moreUpdatesButton.click();

      // Verify modal opens
      const modalTitle = page.getByTestId('modal-title');
      await expect(modalTitle).toBeVisible();
      await expect(modalTitle).toContainText('Other available paths');

      // Close modal
      const closeButton = page.getByTestId('more-updates-modal-close-button');
      await expect(closeButton).toBeVisible();
      await closeButton.click();

      // Verify modal is closed
      await expect(modalTitle).toBeHidden();
    });

    await test.step('Verify second channel (stable-4.17) name', async () => {
      const secondChannelName = page.getByTestId('cv-channel-name').nth(1);
      await expect(secondChannelName).toContainText('stable-4.17 channel');
    });
  });
});
