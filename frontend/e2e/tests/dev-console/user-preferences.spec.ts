import { test, expect } from '../../fixtures';
import type KubernetesClient from '../../clients/kubernetes-client';
import { warmupSPA } from '../../pages/base-page';
import { BuildConfigPage } from '../../pages/dev-console/build-config-page';
import { UserPreferencesPage } from '../../pages/dev-console/user-preferences-page';
import { TopologyPage } from '../../pages/topology-page';

test.describe('User Preferences', { tag: ['@dev-console'] }, () => {
  let userPrefs: UserPreferencesPage;
  let pendingThemeWrites: Promise<void>[];
  let themeWriteErrors: string[];

  const colorPreferenceValues: Record<string, string> = {
    Light: 'light',
    Dark: 'dark',
    'System default': 'systemDefault',
  };
  const contrastPreferenceValues: Record<string, string> = {
    Traditional: 'default',
    Glass: 'glass',
    'High contrast': 'contrast',
    'System default': 'systemDefault',
  };
  const pseudoLocalizedPattern = /\[[^a-zA-Z]+\]/;

  test.beforeEach(async ({ page }) => {
    pendingThemeWrites = [];
    themeWriteErrors = [];
    page.on('request', (request) => {
      if (
        request.method() !== 'PATCH' ||
        !request
          .url()
          .includes('/namespaces/openshift-console-user-settings/configmaps/user-settings-')
      ) {
        return;
      }
      const data = (request.postDataJSON() as { data?: Record<string, string> })?.data;
      if (!data || !['console.theme', 'console.theme/contrast'].some((key) => key in data)) {
        return;
      }
      pendingThemeWrites.push(
        request
          .response()
          .then((response) => {
            if (!response?.ok()) {
              throw new Error(
                `Theme preference PATCH failed with status ${response?.status() ?? 'unknown'}`,
              );
            }
          })
          .catch((error: Error) => {
            themeWriteErrors.push(error.message);
          }),
      );
    });
    await warmupSPA(page);
    userPrefs = new UserPreferencesPage(page);
  });

  const expectThemeSummary = async (summary: string): Promise<void> => {
    const toggle = userPrefs.getThemeToggle();
    await expect(toggle).toHaveText(summary);
    await expect(toggle).toHaveAccessibleName(`Theme: ${summary}`);
  };

  const expectThemeClasses = async ({
    glass,
    highContrast,
    dark,
  }: {
    glass: boolean;
    highContrast: boolean;
    dark: boolean;
  }): Promise<void> => {
    await expect
      .poll(() =>
        userPrefs.getDocumentRoot().evaluate((root) => ({
          glass: root.classList.contains('pf-v6-theme-glass'),
          highContrast: root.classList.contains('pf-v6-theme-high-contrast'),
          dark: root.classList.contains('pf-v6-theme-dark'),
        })),
      )
      .toEqual({ glass, highContrast, dark });
  };

  const expectThemePreferencesPersisted = async (
    k8sClient: KubernetesClient,
    contrast: string,
    color: string,
  ): Promise<void> => {
    const expected = {
      color: JSON.stringify(colorPreferenceValues[color]),
      contrast: JSON.stringify(contrastPreferenceValues[contrast]),
    };
    await expect
      .poll(
        async () => {
          try {
            const configMap = await k8sClient.coreV1Api.readNamespacedConfigMap({
              name: 'user-settings-kubeadmin',
              namespace: 'openshift-console-user-settings',
            });
            return {
              color: configMap.data?.['console.theme'],
              contrast: configMap.data?.['console.theme/contrast'],
            };
          } catch {
            return { color: undefined, contrast: undefined };
          }
        },
        {
          message: `Expected persisted Theme preferences ${JSON.stringify(expected)}`,
          timeout: 30_000,
        },
      )
      .toEqual(expected);
  };

  test.afterEach(async ({ k8sClient }) => {
    await Promise.all(pendingThemeWrites);
    try {
      await k8sClient.patchConfigMap('user-settings-kubeadmin', 'openshift-console-user-settings', {
        'console.preferredPerspective': '',
        'console.preferredCreateEditMethod': '',
        'topology.preferredView': '',
        'devconsole.preferredResource': '',
      });
    } catch {
      // ConfigMap may not exist on fresh clusters where kubeadmin has no user-settings yet
    }
    await k8sClient.clearUserSettings('kubeadmin', ['console.theme', 'console.theme/contrast']);
    expect(themeWriteErrors).toEqual([]);
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

  const themeSelectionPairs = [
    {
      contrast: 'Traditional',
      color: 'Light',
      summary: 'Traditional · Light',
      glass: false,
      highContrast: false,
      dark: false,
    },
    {
      contrast: 'Traditional',
      color: 'Dark',
      summary: 'Traditional · Dark',
      glass: false,
      highContrast: false,
      dark: true,
    },
    {
      contrast: 'Traditional',
      color: 'System default',
      summary: 'Traditional · System default',
      glass: false,
      highContrast: false,
      dark: false,
    },
    {
      contrast: 'Glass',
      color: 'Light',
      summary: 'Glass · Light',
      glass: true,
      highContrast: false,
      dark: false,
    },
    {
      contrast: 'Glass',
      color: 'Dark',
      summary: 'Glass · Dark',
      glass: true,
      highContrast: false,
      dark: true,
    },
    {
      contrast: 'Glass',
      color: 'System default',
      summary: 'Glass · System default',
      glass: true,
      highContrast: false,
      dark: false,
    },
    {
      contrast: 'High contrast',
      color: 'Light',
      summary: 'High contrast · Light',
      glass: false,
      highContrast: true,
      dark: false,
    },
    {
      contrast: 'High contrast',
      color: 'Dark',
      summary: 'High contrast · Dark',
      glass: false,
      highContrast: true,
      dark: true,
    },
    {
      contrast: 'High contrast',
      color: 'System default',
      summary: 'High contrast · System default',
      glass: false,
      highContrast: true,
      dark: false,
    },
    {
      contrast: 'System default',
      color: 'Light',
      summary: 'System default · Light',
      glass: true,
      highContrast: false,
      dark: false,
    },
    {
      contrast: 'System default',
      color: 'Dark',
      summary: 'System default · Dark',
      glass: true,
      highContrast: false,
      dark: true,
    },
    {
      contrast: 'System default',
      color: 'System default',
      summary: 'System default · System default',
      glass: true,
      highContrast: false,
      dark: false,
    },
  ];

  for (const selection of themeSelectionPairs) {
    test(
      `UP-01-THEME: ${selection.summary} applies and summarizes selected labels`,
      { tag: ['@regression'] },
      async ({ page, k8sClient }) => {
        await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
        await userPrefs.navigateToPreferences();
        test.skip(
          !(await userPrefs.isOpenShift5()),
          'The complete Theme matrix requires OpenShift 5',
        );

        await userPrefs.selectThemeOption('Contrast mode', selection.contrast);
        await userPrefs.selectThemeOption('Color scheme', selection.color);
        await userPrefs.closeTheme();

        await expectThemeSummary(selection.summary);
        await expectThemeClasses(selection);
        await expect(userPrefs.getThemeToggle()).toHaveText(selection.summary);
        await expectThemePreferencesPersisted(k8sClient, selection.contrast, selection.color);
      },
    );
  }

  test(
    'UP-01-THEME: System defaults follow both media listeners without replacing selected labels',
    { tag: ['@regression'] },
    async ({ page, k8sClient }) => {
      await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
      await userPrefs.navigateToPreferences();
      test.skip(!(await userPrefs.isOpenShift5()), 'System default contrast requires OpenShift 5');

      await userPrefs.selectThemeOption('Contrast mode', 'System default');
      await userPrefs.selectThemeOption('Color scheme', 'System default');
      await userPrefs.closeTheme();
      await expectThemeSummary('System default · System default');
      await expectThemeClasses({ glass: true, highContrast: false, dark: false });

      await page.emulateMedia({ colorScheme: 'dark', contrast: 'no-preference' });
      await expectThemeClasses({ glass: true, highContrast: false, dark: true });
      await expectThemeSummary('System default · System default');

      await page.emulateMedia({ colorScheme: 'dark', contrast: 'more' });
      await expectThemeClasses({ glass: false, highContrast: true, dark: true });
      await expectThemeSummary('System default · System default');

      await page.emulateMedia({ colorScheme: 'light', contrast: 'more' });
      await expectThemeClasses({ glass: false, highContrast: true, dark: false });
      await expectThemeSummary('System default · System default');

      await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
      await expectThemeClasses({ glass: true, highContrast: false, dark: false });
      await expectThemeSummary('System default · System default');
      await expect(userPrefs.getThemeToggle()).toHaveText('System default · System default');
      await expectThemePreferencesPersisted(k8sClient, 'System default', 'System default');
    },
  );

  const persistedThemePairs = [
    {
      contrast: 'System default',
      color: 'Dark',
      summary: 'System default · Dark',
      classes: { glass: true, highContrast: false, dark: true },
    },
    {
      contrast: 'Glass',
      color: 'System default',
      summary: 'Glass · System default',
      classes: { glass: true, highContrast: false, dark: false },
    },
    {
      contrast: 'System default',
      color: 'System default',
      summary: 'System default · System default',
      classes: { glass: true, highContrast: false, dark: false },
    },
  ];

  for (const selection of persistedThemePairs) {
    test(
      `UP-01-THEME: ${selection.summary} persists through navigation and reload`,
      { tag: ['@regression'] },
      async ({ page, k8sClient }) => {
        await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
        await userPrefs.navigateToPreferences();
        test.skip(
          !(await userPrefs.isOpenShift5()),
          'Combined contrast selection requires OpenShift 5',
        );

        await userPrefs.selectThemeOption('Contrast mode', selection.contrast);
        await userPrefs.selectThemeOption('Color scheme', selection.color);
        await userPrefs.closeTheme();
        await expectThemeSummary(selection.summary);
        await expectThemePreferencesPersisted(k8sClient, selection.contrast, selection.color);

        await warmupSPA(page);
        await userPrefs.navigateToPreferences();
        await page.reload();
        await userPrefs.waitForLoadingComplete();
        await expectThemeSummary(selection.summary);
        await expectThemeClasses(selection.classes);

        await userPrefs.openTheme();
        await expect(userPrefs.getThemeOption('Contrast mode', selection.contrast)).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        await expect(userPrefs.getThemeOption('Color scheme', selection.color)).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      },
    );
  }

  test(
    'UP-01-THEME: changing one persisted dimension preserves the other',
    { tag: ['@regression'] },
    async ({ page, k8sClient }) => {
      await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
      await userPrefs.navigateToPreferences();
      test.skip(
        !(await userPrefs.isOpenShift5()),
        'Combined contrast selection requires OpenShift 5',
      );

      await userPrefs.selectThemeOption('Contrast mode', 'Glass');
      await userPrefs.selectThemeOption('Color scheme', 'Dark');
      await userPrefs.closeTheme();
      await expectThemeSummary('Glass · Dark');

      await userPrefs.selectThemeOption('Contrast mode', 'System default');
      await userPrefs.closeTheme();
      await expectThemeSummary('System default · Dark');
      await expectThemePreferencesPersisted(k8sClient, 'System default', 'Dark');

      await page.reload();
      await userPrefs.waitForLoadingComplete();
      await expectThemeSummary('System default · Dark');
      await expectThemeClasses({ glass: true, highContrast: false, dark: true });
      await userPrefs.openTheme();
      await expect(userPrefs.getThemeOption('Contrast mode', 'System default')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(userPrefs.getThemeOption('Color scheme', 'Dark')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    },
  );

  test(
    'UP-01-THEME: keyboard traversal selects both groups and Escape returns focus',
    { tag: ['@regression'] },
    async ({ page, k8sClient }) => {
      await userPrefs.navigateToPreferences();
      test.skip(!(await userPrefs.isOpenShift5()), 'Both Theme groups require OpenShift 5');

      const toggle = userPrefs.getThemeToggle();
      await toggle.focus();
      await page.keyboard.press('Enter');

      const traditional = userPrefs.getThemeOption('Contrast mode', 'Traditional');
      await expect(traditional).toBeFocused();
      await expect(userPrefs.getThemeOption('Contrast mode', 'System default')).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await page.keyboard.press('Tab');
      const glass = userPrefs.getThemeOption('Contrast mode', 'Glass');
      await expect(glass).toBeFocused();
      await page.keyboard.press('Space');
      await expect(glass).toHaveAttribute('aria-pressed', 'true');

      await page.keyboard.press('Tab');
      await expect(userPrefs.getThemeOption('Contrast mode', 'High contrast')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(userPrefs.getThemeOption('Contrast mode', 'System default')).toBeFocused();
      await page.keyboard.press('Tab');
      const light = userPrefs.getThemeOption('Color scheme', 'Light');
      await expect(light).toBeFocused();
      await page.keyboard.press('Space');
      await expect(light).toHaveAttribute('aria-pressed', 'true');

      await page.keyboard.press('Escape');
      await expect(userPrefs.getThemePanel()).toBeHidden();
      await expect(toggle).toBeFocused();
      await expectThemeSummary('Glass · Light');
      await expectThemePreferencesPersisted(k8sClient, 'Glass', 'Light');
    },
  );

  test.describe('narrow pseudolocalized Theme picker', () => {
    test.use({ locale: 'en' });

    test(
      'UP-01-THEME: pseudolocalized options reflow with visible keyboard focus',
      { tag: ['@regression'] },
      async ({ page, k8sClient }) => {
        await userPrefs.navigateToPreferences();
        test.skip(!(await userPrefs.isOpenShift5()), 'All Theme labels require OpenShift 5');
        await userPrefs.selectThemeOption('Color scheme', 'Light');
        await userPrefs.closeTheme();
        await expectThemePreferencesPersisted(k8sClient, 'System default', 'Light');

        const url = new URL(page.url());
        url.searchParams.set('pseudolocalization', 'true');
        url.searchParams.set('lng', 'en');
        await page.goto(url.toString());
        await userPrefs.waitForLoadingComplete();
        await page.setViewportSize({ width: 320, height: 800 });

        const toggle = userPrefs.getThemeToggle();
        await userPrefs.focusByKeyboard(toggle);
        await page.keyboard.press('Enter');

        const dialog = userPrefs.getThemeDialog();
        await expect(dialog).toHaveAccessibleName(pseudoLocalizedPattern);
        const headingLocators = userPrefs.getThemeHeadings();
        await expect(headingLocators).toHaveCount(2);
        const headings = await headingLocators.all();
        const buttons = [
          ...(await userPrefs.getThemeGroupContainer('Contrast mode').getByRole('button').all()),
          ...(await userPrefs.getThemeGroupContainer('Color scheme').getByRole('button').all()),
        ];
        expect(buttons).toHaveLength(7);

        const optionLabels = buttons.map((button) => button.locator('.pf-v6-c-toggle-group__text'));
        for (const element of [dialog, ...headings, ...optionLabels]) {
          await expect(element).toHaveText(pseudoLocalizedPattern);
          await expect(element).toBeVisible();
          await expect(element).toBeInViewport();
          expect(
            await element.evaluate((node) => {
              const rect = node.getBoundingClientRect();
              return (
                rect.left >= 0 &&
                rect.right <= window.innerWidth &&
                node.scrollWidth <= node.clientWidth
              );
            }),
          ).toBe(true);
        }

        const getFocusIndicator = (button: (typeof buttons)[number]) =>
          button.evaluate((element) => {
            const style = window.getComputedStyle(element);
            const after = window.getComputedStyle(element, '::after');
            return {
              afterBorderWidth: Number.parseFloat(after.borderTopWidth),
              backgroundColor: style.backgroundColor,
            };
          });

        const firstButton = buttons[0];
        await expect(firstButton).toBeFocused();
        await expect(firstButton).toHaveAttribute('aria-pressed', 'false');
        const firstFocusedIndicator = await getFocusIndicator(firstButton);
        await page.keyboard.press('Tab');
        const firstUnfocusedIndicator = await getFocusIndicator(firstButton);
        expect(firstFocusedIndicator.afterBorderWidth).toBeGreaterThan(
          firstUnfocusedIndicator.afterBorderWidth,
        );
        expect(firstFocusedIndicator.backgroundColor).not.toBe(
          firstUnfocusedIndicator.backgroundColor,
        );

        for (let index = 0; index < buttons.length - 2; index++) {
          await page.keyboard.press('Tab');
        }
        const lastButton = buttons[buttons.length - 1];
        await expect(lastButton).toBeFocused();
        await expect(lastButton).toHaveAttribute('aria-pressed', 'false');
        const lastFocusedIndicator = await getFocusIndicator(lastButton);
        await page.keyboard.press('Shift+Tab');
        const lastUnfocusedIndicator = await getFocusIndicator(lastButton);
        expect(lastFocusedIndicator.afterBorderWidth).toBeGreaterThan(
          lastUnfocusedIndicator.afterBorderWidth,
        );
        expect(lastFocusedIndicator.backgroundColor).not.toBe(
          lastUnfocusedIndicator.backgroundColor,
        );
      },
    );
  });

  test(
    'UP-01-THEME: non-OpenShift 5 keeps all color choices, media behavior, and persistence',
    { tag: ['@regression'] },
    async ({ page, k8sClient }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await userPrefs.navigateToPreferences();
      test.skip(
        await userPrefs.isOpenShift5(),
        'This regression requires a non-OpenShift 5 cluster',
      );

      await userPrefs.openTheme();
      await expect(
        userPrefs.getThemePanel().getByRole('group', { name: 'Contrast mode' }),
      ).toHaveCount(0);

      for (const color of ['Light', 'Dark', 'System default']) {
        await userPrefs.selectThemeOption('Color scheme', color);
        await userPrefs.closeTheme();
        await expectThemeSummary(color);
        await expectThemePreferencesPersisted(k8sClient, 'System default', color);
        await page.reload();
        await userPrefs.waitForLoadingComplete();
        await expectThemeSummary(color);
        await userPrefs.openTheme();
        await expect(userPrefs.getThemeOption('Color scheme', color)).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      }

      await userPrefs.closeTheme();
      await expectThemeClasses({ glass: false, highContrast: false, dark: false });
      await page.emulateMedia({ colorScheme: 'dark' });
      await expectThemeClasses({ glass: false, highContrast: false, dark: true });
      await expectThemeSummary('System default');
      await page.emulateMedia({ colorScheme: 'light' });
      await expectThemeClasses({ glass: false, highContrast: false, dark: false });
      await expectThemeSummary('System default');
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
        await userPrefs.selectPreferenceOption('console.preferredCreateEditMethod', 'YAML');
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
        await userPrefs.selectPreferenceOption('devconsole.preferredResource', 'DeploymentConfig');
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
