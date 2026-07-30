import KubernetesClient from '../../../../clients/kubernetes-client';

export const DEFAULT_ALERTMANAGER_YAML = `global:
  resolve_timeout: 5m
inhibit_rules:
- equal:
  - namespace
  - alertname
  source_match:
    severity: critical
  target_match_re:
    severity: warning|info
- equal:
  - namespace
  - alertname
  source_match:
    severity: warning
  target_match_re:
    severity: info
receivers:
- name: Default
- name: Watchdog
- name: Critical
route:
  group_by:
  - namespace
  group_interval: 5m
  group_wait: 30s
  receiver: Default
  repeat_interval: 12h
  routes:
  - matchers:
      - alertname = Watchdog
    receiver: Watchdog
  - matchers:
      - severity = critical
    receiver: Critical`;

export async function resetAlertmanagerConfig(k8sClient: KubernetesClient): Promise<void> {
  await k8sClient.patchSecret('alertmanager-main', 'openshift-monitoring', [
    {
      op: 'replace',
      path: '/data/alertmanager.yaml',
      value: Buffer.from(DEFAULT_ALERTMANAGER_YAML).toString('base64'),
    },
  ]);
}
