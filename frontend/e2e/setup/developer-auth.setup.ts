import * as path from 'path';

import { test as setup } from '@playwright/test';

import { performLogin, saveStorageState } from './login-helper';

const developerStorageState = path.resolve(import.meta.dirname, '..', '.auth', 'developer.json');

setup('login as developer', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  const htpasswdUser = process.env.BRIDGE_HTPASSWD_USERNAME;
  const htpasswdPass = process.env.BRIDGE_HTPASSWD_PASSWORD;

  setup.skip(!htpasswdUser || !htpasswdPass, 'No developer credentials configured');

  const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';
  const htpasswdIdp = process.env.BRIDGE_HTPASSWD_IDP || htpasswdUser!;

  await performLogin(page, baseURL, htpasswdUser!, htpasswdPass!, htpasswdIdp);
  await saveStorageState(page, developerStorageState);
});
