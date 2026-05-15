import * as path from 'path';

import { test as setup } from '@playwright/test';

import { performLogin, saveStorageState } from './login-helper';

const adminStorageState = path.resolve(import.meta.dirname, '..', '.auth', 'kubeadmin.json');

setup('login as kubeadmin', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';
  const username = process.env.OPENSHIFT_USERNAME || 'kubeadmin';
  const password = process.env.BRIDGE_KUBEADMIN_PASSWORD || '';

  await performLogin(page, baseURL, username, password, 'kube:admin');
  await saveStorageState(page, adminStorageState);
});
