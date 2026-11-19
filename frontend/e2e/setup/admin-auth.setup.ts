import { test as setup } from '@playwright/test';

import { adminStorageState, loginFromEnv, saveStorageState } from './login-helper';

// eslint-disable-next-line playwright/expect-expect
setup('login as admin', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  // Warn rather than fail: auth-disabled clusters (see performLogin) log in
  // without credentials, and anything else fails the login below with a
  // clear cause.
  if (!process.env.BRIDGE_KUBEADMIN_PASSWORD) {
    console.warn(
      'BRIDGE_KUBEADMIN_PASSWORD is not set: the admin login requires an auth-disabled cluster',
    );
  }

  await loginFromEnv(page, 'admin');
  await saveStorageState(page, adminStorageState);
});
