import { test as setup } from '@playwright/test';

import { adminStorageState, loginFromEnv, saveStorageState } from './login-helper';

// eslint-disable-next-line playwright/expect-expect
setup('login as admin', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  if (!process.env.BRIDGE_KUBEADMIN_PASSWORD) {
    throw new Error('BRIDGE_KUBEADMIN_PASSWORD is not set: no admin credentials for this run');
  }

  await loginFromEnv(page, 'admin');
  await saveStorageState(page, adminStorageState);
});
