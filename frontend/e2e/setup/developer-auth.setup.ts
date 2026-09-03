import { test as setup } from '@playwright/test';

import { developerStorageState, loginFromEnv, saveStorageState } from './login-helper';

setup('login as developer', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');
  setup.skip(
    !process.env.BRIDGE_HTPASSWD_USERNAME || !process.env.BRIDGE_HTPASSWD_PASSWORD,
    'No developer credentials configured',
  );

  await loginFromEnv(page, 'developer');
  await saveStorageState(page, developerStorageState);
});
