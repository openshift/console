import * as fs from 'fs';
import * as path from 'path';

import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';

import KubernetesClient from './clients/kubernetes-client';

const STORAGE_STATE_DIR = path.resolve(__dirname, '.auth');
const CONFIG_FILE = path.resolve(__dirname, '.test-config.json');

interface LoginOptions {
  baseURL: string;
  provider: string;
  username: string;
  password: string;
  storageStatePath: string;
  config: FullConfig;
}

async function performBrowserLogin(opts: LoginOptions): Promise<void> {
  const browser = await chromium.launch({
    args: ['--ignore-certificate-errors', '--disable-dev-shm-usage', '--no-sandbox'],
  });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    await page.goto(opts.baseURL, { timeout: 90_000, waitUntil: 'domcontentloaded' });

    // Check if auth is disabled (local dev)
    const authDisabled = await page
      .evaluate(() => (window as any).SERVER_FLAGS?.authDisabled)
      .catch(() => false);

    if (authDisabled) {
      console.log(`✅ Auth disabled — saving storage state for ${opts.provider}`);
      await page.context().storageState({ path: opts.storageStatePath });
      fs.chmodSync(opts.storageStatePath, 0o600);
      return;
    }

    // Wait for login page
    await page.waitForSelector('[data-test-id="login"], #inputUsername', { timeout: 30_000 });

    // Click provider button if visible
    const providerButton = page.getByText(opts.provider, { exact: true });
    if ((await providerButton.count()) > 0) {
      await providerButton.click();
    }

    // Fill credentials and submit
    await page.locator('#inputUsername').fill(opts.username);
    await page.locator('#inputPassword').fill(opts.password);
    await page.locator('button[type="submit"]').click();

    // Wait for console to load (user dropdown indicates successful login)
    await page.waitForSelector('[data-test="user-dropdown-toggle"]', { timeout: 60_000 });
    console.log(`✅ Logged in as ${opts.username}`);

    // Save storage state
    await page.context().storageState({ path: opts.storageStatePath });
    fs.chmodSync(opts.storageStatePath, 0o600);
  } finally {
    await browser.close();
  }
}

async function globalSetup(config: FullConfig) {
  if (process.env.SKIP_GLOBAL_SETUP === 'true') {
    console.log('⏭️  Skipping global setup (SKIP_GLOBAL_SETUP=true)');
    return;
  }

  // Remove stale config from previous runs
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }

  console.log('🚀 Setting up test environment...');

  const baseURL =
    process.env.WEB_CONSOLE_URL ||
    config.projects.find((p) => p.name !== 'auth-setup')?.use?.baseURL ||
    'http://localhost:9000';
  const username = process.env.OPENSHIFT_USERNAME || 'kubeadmin';
  const password = process.env.BRIDGE_KUBEADMIN_PASSWORD || '';
  const testNamespace = `console-e2e-${Date.now()}`;

  // --- Phase 1: Auth ---
  let k8sClient: KubernetesClient | null = null;
  let clusterAvailable = false;

  try {
    k8sClient = new KubernetesClient({
      clusterUrl: process.env.CLUSTER_URL || '',
      username,
      password,
    });
    await k8sClient.verifyAuthentication();
    clusterAvailable = true;
    console.log('✅ Cluster authentication verified');
  } catch (err) {
    console.log('⚠️  No cluster access — running in local no-auth mode');
    k8sClient = null;
  }

  // --- Phase 2: Cluster setup ---
  if (clusterAvailable && k8sClient) {
    try {
      await k8sClient.createNamespace(testNamespace);
      await k8sClient.waitForNamespaceReady(testNamespace);
      console.log(`✅ Test namespace created: ${testNamespace}`);
    } catch (err) {
      console.warn(`⚠️  Failed to create test namespace: ${err}`);
    }

    try {
      await k8sClient.setupConsoleUserSettings(username, testNamespace);
      console.log('✅ Console user settings configured (guided tour dismissed)');
    } catch {
      // Non-critical — tour will be dismissed in browser if needed
    }

    // Save config for worker fixtures
    const testConfig = {
      testNamespace,
      authToken: k8sClient.getCurrentUserToken(),
      kubeConfigPath: process.env.KUBECONFIG,
    };
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true, mode: 0o700 });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(testConfig, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
  }

  // --- Phase 3: Browser login ---
  fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true, mode: 0o700 });

  await performBrowserLogin({
    baseURL,
    provider: 'kube:admin',
    username,
    password,
    storageStatePath: path.join(STORAGE_STATE_DIR, 'kubeadmin.json'),
    config,
  });

  // Optional: htpasswd user login
  const htpasswdUser = process.env.BRIDGE_HTPASSWD_USERNAME;
  const htpasswdPass = process.env.BRIDGE_HTPASSWD_PASSWORD;
  if (htpasswdUser && htpasswdPass) {
    const htpasswdIdp = process.env.BRIDGE_HTPASSWD_IDP || htpasswdUser;
    await performBrowserLogin({
      baseURL,
      provider: htpasswdIdp,
      username: htpasswdUser,
      password: htpasswdPass,
      storageStatePath: path.join(STORAGE_STATE_DIR, 'developer.json'),
      config,
    });
  }

  console.log('🏁 Global setup complete');
}

export default globalSetup;
