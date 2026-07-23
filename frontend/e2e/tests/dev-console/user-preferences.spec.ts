import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { BuildConfigPage } from '../../pages/dev-console/build-config-page';
import { UserPreferencesPage } from '../../pages/dev-console/user-preferences-page';
import { TopologyPage } from '../../pages/topology-page';

test.describe('User Preferences', { tag: ['@dev-console'] }, () => {
  let userPrefs: UserPreferencesPage;

  test.beforeEach(async ({ page }) => {
    await warmupSPA(page);
    userPrefs = new UserPreferencesPage(page);
  });

  test.afterEach(async ({ k8sClient }) => {
    try {
      await k8sClient.patchConfigMap(
        'user-settings-kubeadmin',
        'openshift-console-user-settings',
        {
          'console.preferredPerspective': '',
          'console.preferredCreateEditMethod': '',
          'topology.preferredView': '',
          'devconsole.preferredResource': '',
        },
      );
    } catch {
      // Best-effort reset — don't mask the original test failure
    }
  });

  test(
    'UP-01-TC01: General and Language tabs are visible on User Preferences page',
    { tag: ['@smoke'] },
    async () => {
      await test.step('Navigate to User Preferences', async () => {
        await userPrefs.navigateToPreferences();
      });

      await test.step('Verify General tab is visible and selected', async () => {
        const generalTab = userPrefs.getTab('General');
        await expect(generalTab).toBeVisible();
        await expect(generalTab).toHaveAttribute('aria-selected', 'true');
      });

      await test.step('Verify Language tab is visible', async () => {
        await expect(userPrefs.getTab('Language')).toBeVisible();
      });
    },
  );

  test(
    'UP-01-TC02: Setting perspective preference to Developer loads Developer perspective on reload',
    { tag: ['@regression'] },
    async ({ page }) => {
      await test.step('Navigate to User Preferences and set perspective to Developer', async () => {
        await userPrefs.navigateToPreferences();
        await userPrefs.selectPreferenceOption('console.preferredPerspective', 'Developer');
      });

      await test.step('Reload the console without perspective in URL', async () => {
        await warmupSPA(page);
      });

      await test.step('Verify Developer perspective is active', async () => {
        const perspectiveToggle = userPrefs.getPerspectiveSwitcherToggle();
        await expect(perspectiveToggle).toContainText('Developer', { timeout: 30_000 });
      });

    },
  );

  test(
    'UP-01-TC05: Setting topology view preference to Graph shows graph view',
    { tag: ['@regression'] },
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-user-prefs-${Date.now()}`;

      await test.step('Create test namespace', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
      });

      await test.step('Set topology view preference to Graph', async () => {
        await userPrefs.navigateToPreferences();
        await userPrefs.selectPreferenceOption('topology.preferredView', 'Graph');
      });

      await test.step('Navigate to topology page', async () => {
        const topologyPage = new TopologyPage(page);
        await topologyPage.navigateToTopology(ns);
      });

      await test.step('Verify graph view is active', async () => {
        await expect(userPrefs.getTopologyCanvas()).toBeVisible({ timeout: 30_000 });
      });

    },
  );

  test(
    'UP-01-TC08: Setting create/edit method to YAML shows YAML editor on create forms',
    { tag: ['@regression'] },
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-user-prefs-yaml-${Date.now()}`;

      await test.step('Create test namespace', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);
      });

      await test.step('Set create/edit resource method to YAML', async () => {
        await userPrefs.navigateToPreferences();
        await userPrefs.selectPreferenceOption(
          'console.preferredCreateEditMethod',
          'YAML',
        );
      });

      await test.step('Navigate to a create form and verify YAML view', async () => {
        const buildConfigPage = new BuildConfigPage(page);
        await buildConfigPage.navigateToCreateForm(ns);
        const syncedEditor = userPrefs.getSyncedEditor();
        await expect(syncedEditor).toBeVisible({ timeout: 30_000 });
        const yamlRadio = userPrefs.getEditorRadio('YAML view');
        await expect(yamlRadio).toBeChecked();
      });

    },
  );

  test(
    'UP-01-TC12: Setting resource type preference to DeploymentConfig',
    { tag: ['@regression'] },
    async () => {
      await test.step('Navigate to User Preferences and select Applications tab', async () => {
        await userPrefs.navigateToPreferences();
        const applicationsTab = userPrefs.getTab('Applications');
        await applicationsTab.click();
      });

      await test.step('Set resource type to DeploymentConfig', async () => {
        await userPrefs.selectPreferenceOption(
          'devconsole.preferredResource',
          'DeploymentConfig',
        );
      });

      await test.step('Verify DeploymentConfig is selected', async () => {
        const dropdown = userPrefs.getPreferenceDropdown('devconsole.preferredResource');
        await expect(dropdown).toContainText('DeploymentConfig');
      });

      // Note: This test does not verify the preference takes effect in a create form.
      // Full verification is deferred to a future batch for feature parity.
    },
  );
});
