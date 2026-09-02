import * as path from 'path';

import { test as setup } from '@playwright/test';

import { getAdminCredentials, performLogin, saveStorageState } from './login-helper';

const adminStorageState = path.resolve(import.meta.dirname, '..', '.auth', 'kubeadmin.json');

setup('login as kubeadmin', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  const { username, password, idpName } = getAdminCredentials();
  await performLogin(page, username, password, idpName);
  await saveStorageState(page, adminStorageState);
});
