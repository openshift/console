import { test as setup } from '@playwright/test';

import { adminStorageState, loginFromEnv, saveStorageState } from './login-helper';

// eslint-disable-next-line playwright/expect-expect
setup('login as kubeadmin', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  await loginFromEnv(page, 'admin');
  await saveStorageState(page, adminStorageState);
});
