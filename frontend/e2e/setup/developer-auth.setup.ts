import * as path from 'path';

import { test as setup } from '@playwright/test';

import { getDeveloperCredentials, performLogin, saveStorageState } from './login-helper';

const developerStorageState = path.resolve(import.meta.dirname, '..', '.auth', 'developer.json');

setup('login as developer', async ({ page }) => {
  setup.skip(process.env.SKIP_GLOBAL_SETUP === 'true', 'SKIP_GLOBAL_SETUP is set');

  const creds = getDeveloperCredentials();
  setup.skip(!creds, 'No developer credentials configured');

  await performLogin(page, creds!.username, creds!.password, creds!.idpName);
  await saveStorageState(page, developerStorageState);
});
