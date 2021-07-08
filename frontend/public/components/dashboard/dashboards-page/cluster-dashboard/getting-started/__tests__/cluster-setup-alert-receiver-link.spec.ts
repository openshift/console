import { Base64 } from 'js-base64';

import { SecretKind } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';

import { useAlertReceiverLink } from '../cluster-setup-alert-receiver-link';

jest.mock('react-i18next', () => ({
  ...require.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key) => key.split('~')[1] }),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const useAccessReviewMock = useAccessReview as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

// Copied from a cluster-bot cluster from /monitoring/alertmanager which shows
// a "Incomplete alert receivers" alert message on the Details tab.
const defaultClusterAlertManagerConfigYAML = `
"global":
  "resolve_timeout": "5m"
"inhibit_rules":
- "equal":
  - "namespace"
  - "alertname"
  "source_match":
    "severity": "critical"
  "target_match_re":
    "severity": "warning|info"
- "equal":
  - "namespace"
  - "alertname"
  "source_match":
    "severity": "warning"
  "target_match_re":
    "severity": "info"
"receivers":
- "name": "Default"
- "name": "Watchdog"
- "name": "Critical"
"route":
  "group_by":
  - "namespace"
  "group_interval": "5m"
  "group_wait": "30s"
  "receiver": "Default"
  "repeat_interval": "12h"
  "routes":
  - "match":
      "alertname": "Watchdog"
    "receiver": "Watchdog"
  - "match":
      "severity": "critical"
    "receiver": "Critical"
`;

// Copied from a cluster-bot cluster from /monitoring/alertmanager with added
// webhooks configuration to solve the "Incomplete alert receivers" alert message.
const configuredClusterAlertManagerConfigYAML = `
global:
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
    webhook_configs:
      - url: 'https://www.openshift.com'
  - name: Watchdog
  - name: Critical
    webhook_configs:
      - url: 'https://www.openshift.com'
route:
  group_by:
    - namespace
  group_interval: 5m
  group_wait: 30s
  receiver: Default
  repeat_interval: 12h
  routes:
    - match:
        alertname: Watchdog
      receiver: Watchdog
    - receiver: Critical
      match:
        severity: critical
`;

describe('useAlertReceiverLink', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should not watch resource if it can not edit it', () => {
    useAccessReviewMock.mockReturnValue(false);
    useK8sWatchResourceMock.mockReturnValue([undefined, true, undefined]);

    const { result } = testHook(() => useAlertReceiverLink());

    expect(result.current).toBe(null);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
  });

  it('should watch resource if it can edit it, return null until it is loaded', () => {
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([undefined, false, undefined]);

    const { result } = testHook(() => useAlertReceiverLink());

    expect(result.current).toBe(null);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      kind: 'Secret',
      isList: false,
      namespaced: true,
      namespace: 'openshift-monitoring',
      name: 'alertmanager-main',
    });
  });

  it('should return no link if there is no secret found', () => {
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([null, true, null]);

    const { result } = testHook(() => useAlertReceiverLink());

    expect(result.current).toBe(null);
  });

  it('should return no link if there is no alert manager is defined', () => {
    const oauthSecret: SecretKind = {};
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([oauthSecret, true, null]);

    const { result } = testHook(() => useAlertReceiverLink());

    expect(result.current).toBe(null);
  });

  it('should return link if there are incomplete alert receivers', () => {
    const oauthSecret: SecretKind = {
      data: {
        'alertmanager.yaml': Base64.encode(defaultClusterAlertManagerConfigYAML),
      },
    };
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([oauthSecret, true, null]);

    const { result } = testHook(() => useAlertReceiverLink());

    expect(result.current).toEqual({
      id: 'alert-receivers',
      title: 'Configure alert receivers',
      href: '/monitoring/alertmanagerconfig',
    });
  });

  it('should return no link if all alert receivers are completed', () => {
    const oauthSecret: SecretKind = {
      data: {
        'alertmanager.yaml': Base64.encode(configuredClusterAlertManagerConfigYAML),
      },
    };
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([oauthSecret, true, null]);

    const { result } = testHook(() => useAlertReceiverLink());

    expect(result.current).toBe(null);
  });

  it('should return no link if there is an error', () => {
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([null, true, new Error('Any error')]);

    const { result } = testHook(() => useAlertReceiverLink());

    expect(result.current).toBe(null);
  });
});
