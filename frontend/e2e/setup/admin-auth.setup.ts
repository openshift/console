import { test as setup } from '@playwright/test';

import { adminStorageState, loginFromEnv, saveStorageState } from './login-helper';

// eslint-disable-next-line playwright/expect-expect
setup('login as admin', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  // Warn rather than fail: auth-disabled clusters (see performLogin) log in
  // without credentials; anything else fails the login below, with this
  // warning as the diagnostic pointer in the log.
  if (!process.env.BRIDGE_KUBEADMIN_PASSWORD) {
    console.warn(
      'BRIDGE_KUBEADMIN_PASSWORD is not set: the admin login requires an auth-disabled cluster',
    );
  }

  await loginFromEnv(page, 'admin');
  await saveStorageState(page, adminStorageState);
});
