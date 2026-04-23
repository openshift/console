import * as fs from 'fs';
import * as https from 'https';
import * as net from 'net';
import * as path from 'path';
import { URL } from 'url';

import * as k8s from '@kubernetes/client-node';

export interface ClusterAuthConfig {
  clusterUrl: string;
  username: string;
  password: string;
  token?: string;
}

function isNotFound(err: unknown): boolean {
  if (typeof err === 'object' && err !== null) {
    const statusCode = (err as any).statusCode ?? (err as any).response?.statusCode;
    if (statusCode === 404) {
      return true;
    }
    const msg = err instanceof Error ? err.message : String(err);
    return msg.includes('404') || msg.includes('not found');
  }
  return false;
}

async function pollUntil(
  condition: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs = 1_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

export default class KubernetesClient {
  private readonly k8sApi: k8s.CoreV1Api;
  private readonly appsApi: k8s.AppsV1Api;
  private readonly coApi: k8s.CustomObjectsApi;
  private readonly kubeConfig: k8s.KubeConfig;

  private static getProxyUrl(): string | undefined {
    return (
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy
    );
  }

  private static createProxyAgent(proxyUrl: string): https.Agent {
    const proxy = new URL(proxyUrl);
    return new https.Agent({
      rejectUnauthorized: false,
      createConnection: (options, callback) => {
        const proxySocket = net.connect(
          { host: proxy.hostname, port: parseInt(proxy.port || '3128', 10) },
          () => {
            proxySocket.write(
              [
                `CONNECT ${options.host}:${options.port} HTTP/1.1`,
                `Host: ${options.host}:${options.port}`,
                'Connection: keep-alive',
                '',
                '',
              ].join('\r\n'),
            );
          },
        );
        let responseData = '';
        const onData = (chunk: Buffer) => {
          responseData += chunk.toString();
          if (responseData.includes('\r\n\r\n')) {
            proxySocket.removeListener('data', onData);
            const [statusLine] = responseData.split('\r\n');
            const statusCode = parseInt(statusLine.split(' ')[1], 10);
            if (statusCode === 200) {
              callback(null, proxySocket);
            } else {
              proxySocket.destroy();
              callback(new Error(`Proxy CONNECT failed: ${statusCode}`) as any, null as any);
            }
          }
        };
        proxySocket.on('data', onData);
        proxySocket.on('error', (err) => {
          callback(err as any, null as any);
        });
      },
    } as https.AgentOptions);
  }

  static async getOAuthToken(
    clusterUrl: string,
    username: string,
    password: string,
  ): Promise<string> {
    const oauthServerUrl = await KubernetesClient.getOAuthServerUrl(clusterUrl);
    return new Promise((resolve, reject) => {
      const authHeader = Buffer.from(`${username}:${password}`).toString('base64');
      const tokenUrl = new URL('/oauth/authorize', oauthServerUrl);
      tokenUrl.searchParams.set('response_type', 'token');
      tokenUrl.searchParams.set('client_id', 'openshift-challenging-client');
      const proxyUrl = KubernetesClient.getProxyUrl();
      const agent = proxyUrl ? KubernetesClient.createProxyAgent(proxyUrl) : undefined;
      const options: https.RequestOptions = {
        hostname: tokenUrl.hostname,
        port: tokenUrl.port || 443,
        path: tokenUrl.pathname + tokenUrl.search,
        method: 'GET',
        headers: { Authorization: `Basic ${authHeader}`, 'X-CSRF-Token': '1' },
        rejectUnauthorized: false,
        agent,
      };
      const req = https.request(options, (res) => {
        const location = res.headers.location;
        if (location && location.includes('access_token=')) {
          const match = location.match(/access_token=([^&]+)/);
          if (match) {
            resolve(match[1]);
            return;
          }
        }
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          reject(
            new Error(
              `OAuth authentication failed: HTTP ${res.statusCode}. Response: ${body.substring(
                0,
                200,
              )}`,
            ),
          );
        });
      });
      req.on('error', (err) => reject(new Error(`OAuth request failed: ${err.message}`)));
      req.end();
    });
  }

  private static async getOAuthServerUrl(clusterUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const url = new URL('/.well-known/oauth-authorization-server', clusterUrl);
      const proxyUrl = KubernetesClient.getProxyUrl();
      const agent = proxyUrl ? KubernetesClient.createProxyAgent(proxyUrl) : undefined;
      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        rejectUnauthorized: false,
        agent,
      };
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body).issuer || clusterUrl);
          } catch {
            resolve(clusterUrl);
          }
        });
      });
      req.on('error', () => resolve(clusterUrl));
      req.end();
    });
  }

  static async generateKubeconfig(
    clusterUrl: string,
    username: string,
    password: string,
    outputPath: string,
  ): Promise<string> {
    const token = await KubernetesClient.getOAuthToken(clusterUrl, username, password);
    const kubeconfigYaml = [
      'apiVersion: v1',
      'kind: Config',
      'clusters:',
      '  - name: cluster',
      '    cluster:',
      `      server: ${clusterUrl}`,
      '      insecure-skip-tls-verify: true',
      'contexts:',
      '  - name: context',
      '    context:',
      '      cluster: cluster',
      '      user: user',
      'current-context: context',
      'users:',
      '  - name: user',
      '    user:',
      `      token: ${token}`,
      '',
    ].join('\n');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(outputPath, kubeconfigYaml, { encoding: 'utf8', mode: 0o600 });
    return outputPath;
  }

  constructor(config: ClusterAuthConfig, kubeConfigPath?: string) {
    this.kubeConfig = new k8s.KubeConfig();
    const effectivePath = kubeConfigPath || this.tryDiscoverKubeConfig();
    if (effectivePath && fs.existsSync(effectivePath)) {
      this.kubeConfig.loadFromFile(effectivePath);
    } else {
      // Try default kubeconfig (~/.kube/config from oc login), then token fallback
      try {
        this.kubeConfig.loadFromDefault();
      } catch {
        if (config.token && config.clusterUrl) {
          this.kubeConfig.loadFromOptions({
            clusters: [{ name: 'cluster', server: config.clusterUrl, skipTLSVerify: true }],
            contexts: [{ cluster: 'cluster', name: 'context', user: 'user' }],
            currentContext: 'context',
            users: [{ name: 'user', token: config.token }],
          });
        } else {
          throw new Error(
            'No kubeconfig found and no token/clusterUrl provided. Run "oc login" or set KUBECONFIG.',
          );
        }
      }
    }

    const proxyUrl = KubernetesClient.getProxyUrl();
    if (proxyUrl && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    this.k8sApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
    this.coApi = this.kubeConfig.makeApiClient(k8s.CustomObjectsApi);
    this.appsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
  }

  private tryDiscoverKubeConfig(): string | undefined {
    const kubeConfigDir = path.join(process.cwd(), '.kubeconfigs');
    const configPath = path.join(kubeConfigDir, 'test-config');
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    return undefined;
  }

  get kc(): k8s.KubeConfig {
    return this.kubeConfig;
  }
  get coreV1Api(): k8s.CoreV1Api {
    return this.k8sApi;
  }
  get customObjectsApi(): k8s.CustomObjectsApi {
    return this.coApi;
  }
  get appsV1Api(): k8s.AppsV1Api {
    return this.appsApi;
  }

  getCurrentUserToken(): string | undefined {
    try {
      return this.kubeConfig.getCurrentUser()?.token;
    } catch {
      return undefined;
    }
  }

  async verifyAuthentication(): Promise<boolean> {
    await this.k8sApi.listNamespace({ limit: 1 });
    return true;
  }

  async createNamespace(name: string, labels?: Record<string, string>): Promise<void> {
    try {
      await this.k8sApi.readNamespace({ name });
      return; // already exists
    } catch (err) {
      if (!isNotFound(err)) {
        throw err;
      }
    }
    await this.k8sApi.createNamespace({
      body: {
        metadata: { name, labels: { ...labels, 'openshift.io/run-level': '0' } },
      },
    });
  }

  async deleteNamespace(name: string): Promise<void> {
    try {
      await this.k8sApi.deleteNamespace({ name });
    } catch (err) {
      if (!isNotFound(err)) {
        throw err;
      }
    }
  }

  async waitForNamespaceReady(name: string, timeoutMs = 30_000): Promise<boolean> {
    return pollUntil(
      async () => {
        try {
          const ns = await this.k8sApi.readNamespace({ name });
          return ns?.status?.phase === 'Active';
        } catch {
          return false;
        }
      },
      timeoutMs,
      1_000,
    );
  }

  async waitForNamespaceDeleted(name: string, timeoutMs = 120_000): Promise<boolean> {
    return pollUntil(
      async () => {
        try {
          await this.k8sApi.readNamespace({ name });
          return false; // still exists
        } catch (err) {
          if (isNotFound(err)) {
            return true;
          } // gone
          throw err; // unexpected error — don't silently swallow
        }
      },
      timeoutMs,
      2_000,
    );
  }

  async setupConsoleUserSettings(username = 'kubeadmin', defaultNamespace?: string): Promise<void> {
    const namespace = 'openshift-console-user-settings';
    const configMapName = `user-settings-${username}`;
    const patchData: Record<string, string> = {
      'console.guidedTour': JSON.stringify({
        admin: { completed: true },
        dev: { completed: true },
      }),
    };
    if (defaultNamespace) {
      patchData['console.lastNamespace'] = defaultNamespace;
    }
    try {
      await this.patchConfigMap(configMapName, namespace, patchData);
    } catch {
      // ConfigMap may not exist yet — that's fine, tour will be dismissed in browser
    }
  }

  async patchConfigMap(
    name: string,
    namespace: string,
    patchData: Record<string, string>,
  ): Promise<void> {
    const existing = await this.k8sApi.readNamespacedConfigMap({ name, namespace });
    const existingData = (existing as any)?.data || {};
    const mergedData = { ...existingData, ...patchData };
    await this.k8sApi.patchNamespacedConfigMap({
      name,
      namespace,
      body: { data: mergedData },
      contentType: k8s.PatchStrategy.MergePatch,
    } as any);
  }

  async deleteConfigMap(name: string, namespace: string): Promise<void> {
    try {
      await this.k8sApi.deleteNamespacedConfigMap({ name, namespace });
    } catch (err) {
      if (!isNotFound(err)) {
        throw err;
      }
    }
  }

  async deleteSecret(name: string, namespace: string): Promise<void> {
    try {
      await this.k8sApi.deleteNamespacedSecret({ name, namespace });
    } catch (err) {
      if (!isNotFound(err)) {
        throw err;
      }
    }
  }

  async createCustomResource(
    group: string,
    version: string,
    namespace: string,
    plural: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const response = await this.coApi.createNamespacedCustomObject({
      body,
      group,
      namespace,
      plural,
      version,
    });
    return response;
  }

  async deleteCustomResource(
    group: string,
    version: string,
    namespace: string,
    plural: string,
    name: string,
  ): Promise<void> {
    try {
      await this.coApi.deleteNamespacedCustomObject({ group, name, namespace, plural, version });
    } catch (err) {
      if (!isNotFound(err)) {
        throw err;
      }
    }
  }

  async getCustomResource(
    group: string,
    version: string,
    namespace: string,
    plural: string,
    name: string,
  ): Promise<unknown> {
    const response = await this.coApi.getNamespacedCustomObject({
      group,
      name,
      namespace,
      plural,
      version,
    });
    return response;
  }

  async listCustomResources(
    group: string,
    version: string,
    namespace: string,
    plural: string,
  ): Promise<unknown[]> {
    try {
      const response = await this.coApi.listNamespacedCustomObject({
        group,
        namespace,
        plural,
        version,
      });
      return (response as any)?.items || [];
    } catch {
      return [];
    }
  }

  async getPods(namespace: string): Promise<k8s.V1Pod[]> {
    const response = await this.k8sApi.listNamespacedPod({ namespace });
    return response.items || [];
  }
}
