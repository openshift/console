// Assisted-by: Claude
import type { TFunction } from 'i18next';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import type { MachineHealthCheckKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import type { NodeHealthCheckKind } from '../HealthCheckUtils';
import {
  computeRemediationTimeBoundsFromRefs,
  dedupeRemediationTemplateRefs,
  estimateFarRemediationBoundsFromTemplate,
  estimateMdrRemediationBoundsFromTemplate,
  estimatedRecoveryTimeDisplay,
  estimateSnrRemediationBoundsFromConfig,
  FALLBACK_REMEDIATION_BOUNDS,
  formatDurationForDisplay,
  formatTimeoutForDisplay,
  getMaxTimeoutFromConditions,
  getRemediationDisplay,
  getRemediationTemplateRefsFromHealthCheck,
  getRemediationTemplateRefsFromHealthChecks,
} from '../HighAvailabilityUtils';

describe('HighAvailabilityUtils', () => {
  const mockT = ((key: string, options?: any) => {
    if (key === 'console-app~auto-reboot') {
      return 'auto-reboot';
    }
    if (key === 'console-app~machine replacement') {
      return 'machine replacement';
    }
    if (key === 'console-app~template remediation') {
      return 'template remediation';
    }
    if (key === 'console-app~{{prefix}}: {{remediation}}; Drain: {{timeout}} timeout') {
      return `${options.prefix}: ${options.remediation}; Drain: ${options.timeout} timeout`;
    }
    if (key === 'console-app~{{prefix}}: {{remediation}}') {
      return `${options.prefix}: ${options.remediation}`;
    }
    if (key === 'console-app~{{minMinutes}}-{{maxMinutes}} min') {
      return `${options.minMinutes}-${options.maxMinutes} min`;
    }
    return key;
  }) as TFunction;

  describe('formatDurationForDisplay', () => {
    it('should return undefined for empty string', () => {
      expect(formatDurationForDisplay('')).toBeUndefined();
      expect(formatDurationForDisplay('  ')).toBeUndefined();
      expect(formatDurationForDisplay(undefined)).toBeUndefined();
    });

    it('should return value as-is if it already has a unit suffix', () => {
      expect(formatDurationForDisplay('300s')).toBe('300s');
      expect(formatDurationForDisplay('5m')).toBe('5m');
      expect(formatDurationForDisplay('2h')).toBe('2h');
      expect(formatDurationForDisplay('1d')).toBe('1d');
    });

    it('should append "s" if no unit suffix is present', () => {
      expect(formatDurationForDisplay('300')).toBe('300s');
      expect(formatDurationForDisplay('60')).toBe('60s');
    });
  });

  describe('formatTimeoutForDisplay', () => {
    it('should format seconds that are multiples of 60 as minutes', () => {
      expect(formatTimeoutForDisplay(60)).toBe('1m');
      expect(formatTimeoutForDisplay(300)).toBe('5m');
      expect(formatTimeoutForDisplay(600)).toBe('10m');
    });

    it('should format non-multiples of 60 as seconds', () => {
      expect(formatTimeoutForDisplay(45)).toBe('45s');
      expect(formatTimeoutForDisplay(90)).toBe('90s');
      expect(formatTimeoutForDisplay(125)).toBe('125s');
    });
  });

  describe('getMaxTimeoutFromConditions', () => {
    it('should return undefined for empty array', () => {
      expect(getMaxTimeoutFromConditions([])).toBeUndefined();
    });

    it('should find max timeout from conditions with timeout field', () => {
      const conditions = [
        { timeout: '300s' },
        { timeout: '60s' },
        { timeout: '600s' },
        { timeout: '120s' },
      ];
      expect(getMaxTimeoutFromConditions(conditions)).toBe(600);
    });

    it('should find max timeout from conditions with duration field', () => {
      const conditions = [{ duration: '5m' }, { duration: '2m' }, { duration: '10m' }];
      expect(getMaxTimeoutFromConditions(conditions)).toBe(600);
    });

    it('should skip invalid durations', () => {
      const conditions = [{ timeout: '300s' }, { timeout: 'invalid' }, { timeout: '60s' }];
      expect(getMaxTimeoutFromConditions(conditions)).toBe(300);
    });

    it('should handle mixed timeout and duration fields', () => {
      const conditions = [{ timeout: '300s' }, { duration: '5m' }];
      expect(getMaxTimeoutFromConditions(conditions)).toBe(300);
    });

    it('should return undefined if all conditions have invalid timeouts', () => {
      const conditions = [{ timeout: 'invalid' }, { timeout: '' }];
      expect(getMaxTimeoutFromConditions(conditions)).toBeUndefined();
    });
  });

  describe('getRemediationDisplay', () => {
    it('should return DASH when no health checks are provided', () => {
      const result = getRemediationDisplay([], [], mockT);
      expect(result).toBe(DASH);
    });

    it('should return MHC machine replacement without timeout', () => {
      const mhc: MachineHealthCheckKind = {
        apiVersion: 'machine.openshift.io/v1beta1',
        kind: 'MachineHealthCheck',
        metadata: {
          name: 'test-mhc',
          namespace: 'openshift-machine-api',
        },
        spec: {
          selector: {},
          unhealthyConditions: [],
        },
      };

      const result = getRemediationDisplay([mhc], [], mockT);
      expect(result).toBe('MHC: machine replacement');
    });

    it('should return MHC machine replacement with timeout', () => {
      const mhc: MachineHealthCheckKind = {
        apiVersion: 'machine.openshift.io/v1beta1',
        kind: 'MachineHealthCheck',
        metadata: {
          name: 'test-mhc',
          namespace: 'openshift-machine-api',
        },
        spec: {
          selector: {},
          unhealthyConditions: [
            {
              type: 'Ready',
              status: 'False',
              timeout: '300s',
            },
          ],
        },
      };

      const result = getRemediationDisplay([mhc], [], mockT);
      expect(result).toBe('MHC: machine replacement; Drain: 5m timeout');
    });

    it('should return MHC auto-reboot for external-baremetal annotation', () => {
      const mhc: MachineHealthCheckKind = {
        apiVersion: 'machine.openshift.io/v1beta1',
        kind: 'MachineHealthCheck',
        metadata: {
          name: 'test-mhc',
          namespace: 'openshift-machine-api',
          annotations: {
            'machine.openshift.io/remediation-strategy': 'external-baremetal',
          },
        },
        spec: {
          selector: {},
          unhealthyConditions: [],
        },
      };

      const result = getRemediationDisplay([mhc], [], mockT);
      expect(result).toBe('MHC: auto-reboot');
    });

    it('should return NHC template remediation without timeout', () => {
      const nhc: NodeHealthCheckKind = {
        apiVersion: 'remediation.medik8s.io/v1alpha1',
        kind: 'NodeHealthCheck',
        metadata: {
          name: 'test-nhc',
        },
        spec: {
          selector: {},
          unhealthyConditions: [],
        },
      };

      const result = getRemediationDisplay([], [nhc], mockT);
      expect(result).toBe('NHC: template remediation');
    });

    it('should return NHC template remediation with timeout', () => {
      const nhc: NodeHealthCheckKind = {
        apiVersion: 'remediation.medik8s.io/v1alpha1',
        kind: 'NodeHealthCheck',
        metadata: {
          name: 'test-nhc',
        },
        spec: {
          selector: {},
          unhealthyConditions: [
            {
              type: 'Ready',
              status: 'Unknown',
              duration: '180s',
            },
          ],
        },
      };

      const result = getRemediationDisplay([], [nhc], mockT);
      expect(result).toBe('NHC: template remediation; Drain: 3m timeout');
    });

    it('should prefer MHC over NHC when both are provided', () => {
      const mhc: MachineHealthCheckKind = {
        apiVersion: 'machine.openshift.io/v1beta1',
        kind: 'MachineHealthCheck',
        metadata: {
          name: 'test-mhc',
          namespace: 'openshift-machine-api',
        },
        spec: {
          selector: {},
          unhealthyConditions: [],
        },
      };

      const nhc: NodeHealthCheckKind = {
        apiVersion: 'remediation.medik8s.io/v1alpha1',
        kind: 'NodeHealthCheck',
        metadata: {
          name: 'test-nhc',
        },
        spec: {
          selector: {},
          unhealthyConditions: [],
        },
      };

      const result = getRemediationDisplay([mhc], [nhc], mockT);
      expect(result).toBe('MHC: machine replacement');
    });

    it('should use max timeout from multiple conditions', () => {
      const mhc: MachineHealthCheckKind = {
        apiVersion: 'machine.openshift.io/v1beta1',
        kind: 'MachineHealthCheck',
        metadata: {
          name: 'test-mhc',
          namespace: 'openshift-machine-api',
        },
        spec: {
          selector: {},
          unhealthyConditions: [
            {
              type: 'Ready',
              status: 'False',
              timeout: '300s',
            },
            {
              type: 'DiskPressure',
              status: 'True',
              timeout: '600s',
            },
          ],
        },
      };

      const result = getRemediationDisplay([mhc], [], mockT);
      expect(result).toBe('MHC: machine replacement; Drain: 10m timeout');
    });
  });

  describe('estimatedRecoveryTimeDisplay', () => {
    const snrConfigs: K8sResourceKind[] = [
      {
        metadata: { name: 'self-node-remediation-config', namespace: 'openshift-machine-api' },
        spec: { safeTimeToAssumeNodeRebootedSeconds: 180 },
      },
    ];

    const mhcWithRemediationTemplate = (timeout: string): K8sResourceKind => ({
      apiVersion: 'machine.openshift.io/v1beta1',
      kind: 'MachineHealthCheck',
      metadata: {
        name: 'test-mhc',
        namespace: 'openshift-machine-api',
      },
      spec: {
        selector: {},
        unhealthyConditions: [
          {
            type: 'Ready',
            status: 'False',
            timeout,
          },
        ],
        remediationTemplate: {
          kind: 'SelfNodeRemediationTemplate',
          name: 'snr-template',
          namespace: 'openshift-machine-api',
        },
      },
    });

    it('should return DASH when no conditions have timeouts', () => {
      const mhc: MachineHealthCheckKind = {
        apiVersion: 'machine.openshift.io/v1beta1',
        kind: 'MachineHealthCheck',
        metadata: {
          name: 'test-mhc',
          namespace: 'openshift-machine-api',
        },
        spec: {
          selector: {},
          unhealthyConditions: [],
        },
      };

      const result = estimatedRecoveryTimeDisplay([mhc], [], [], [], mockT);
      expect(result).toBe(DASH);
    });

    it('should calculate recovery time with fallback remediation bounds', () => {
      const mhc = mhcWithRemediationTemplate('300s') as K8sResourceKind;
      delete mhc.spec?.remediationTemplate;

      const result = estimatedRecoveryTimeDisplay(
        [mhc as MachineHealthCheckKind],
        [],
        [],
        [],
        mockT,
      );

      // (50 + 300 + 15 + 15) / 60 = 380 / 60 = 7 min (min)
      // (50 + 300 + 15 + 180) / 60 = 545 / 60 = 10 min (max)
      expect(result).toBe('7-10 min');
    });

    it('should calculate recovery time with computed remediation bounds', () => {
      const mhc = mhcWithRemediationTemplate('300s');

      const result = estimatedRecoveryTimeDisplay(
        [mhc as MachineHealthCheckKind],
        [],
        snrConfigs,
        [],
        mockT,
      );

      // (50 + 300 + 15 + 180) / 60 = 545 / 60 = 10 min (min)
      // (50 + 300 + 15 + 300) / 60 = 665 / 60 = 12 min (max)
      expect(result).toBe('10-12 min');
    });

    it('should use max timeout from multiple health checks', () => {
      const mhc = mhcWithRemediationTemplate('300s');

      const nhc: NodeHealthCheckKind = {
        apiVersion: 'remediation.medik8s.io/v1alpha1',
        kind: 'NodeHealthCheck',
        metadata: {
          name: 'test-nhc',
        },
        spec: {
          selector: {},
          unhealthyConditions: [
            {
              type: 'Ready',
              status: 'Unknown',
              duration: '600s',
            },
          ],
        },
      };

      const result = estimatedRecoveryTimeDisplay(
        [mhc as MachineHealthCheckKind],
        [nhc],
        snrConfigs,
        [],
        mockT,
      );

      // Uses max timeout of 600s
      // (50 + 600 + 15 + 180) / 60 = 845 / 60 = 15 min (min)
      // (50 + 600 + 15 + 300) / 60 = 965 / 60 = 17 min (max)
      expect(result).toBe('15-17 min');
    });

    it('should enforce minimum of 1 minute for recovery time', () => {
      const mhc = mhcWithRemediationTemplate('1s');
      delete mhc.spec?.remediationTemplate;

      const result = estimatedRecoveryTimeDisplay(
        [mhc as MachineHealthCheckKind],
        [],
        [],
        [],
        mockT,
      );

      // (50 + 1 + 15 + 15) / 60 = 2 min (min)
      // (50 + 1 + 15 + 180) / 60 = 5 min (max)
      expect(result).toBe('2-5 min');
    });

    it('should compute recovery time when health check has remediation templates', () => {
      const mhc = mhcWithRemediationTemplate('300s');

      const result = estimatedRecoveryTimeDisplay(
        [mhc as MachineHealthCheckKind],
        [],
        snrConfigs,
        [],
        mockT,
      );

      expect(result).toBe('10-12 min');
    });
  });

  describe('getRemediationTemplateRefsFromHealthCheck', () => {
    it('should extract single remediationTemplate', () => {
      const healthCheck = {
        spec: {
          remediationTemplate: {
            apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
            kind: 'SelfNodeRemediationTemplate',
            name: 'snr-template',
            namespace: 'openshift-machine-api',
          },
        },
      };

      const result = getRemediationTemplateRefsFromHealthCheck(healthCheck);

      expect(result).toEqual([
        {
          apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
          kind: 'SelfNodeRemediationTemplate',
          name: 'snr-template',
          namespace: 'openshift-machine-api',
        },
      ]);
    });

    it('should extract escalatingRemediations', () => {
      const healthCheck = {
        spec: {
          escalatingRemediations: [
            {
              remediationTemplate: {
                apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
                kind: 'SelfNodeRemediationTemplate',
                name: 'snr-template',
              },
            },
            {
              remediationTemplate: {
                apiVersion: 'fence-agents-remediation.medik8s.io/v1alpha1',
                kind: 'FenceAgentsRemediationTemplate',
                name: 'far-template',
              },
            },
          ],
        },
      };

      const result = getRemediationTemplateRefsFromHealthCheck(healthCheck);

      expect(result).toHaveLength(2);
      expect(result[0].kind).toBe('SelfNodeRemediationTemplate');
      expect(result[1].kind).toBe('FenceAgentsRemediationTemplate');
    });

    it('should combine single and escalating templates', () => {
      const healthCheck = {
        spec: {
          remediationTemplate: {
            kind: 'SelfNodeRemediationTemplate',
            name: 'snr-template',
          },
          escalatingRemediations: [
            {
              remediationTemplate: {
                kind: 'FenceAgentsRemediationTemplate',
                name: 'far-template',
              },
            },
          ],
        },
      };

      const result = getRemediationTemplateRefsFromHealthCheck(healthCheck);

      expect(result).toHaveLength(2);
      expect(result[0].kind).toBe('SelfNodeRemediationTemplate');
      expect(result[1].kind).toBe('FenceAgentsRemediationTemplate');
    });

    it('should filter out entries without names', () => {
      const healthCheck = {
        spec: {
          remediationTemplate: {
            kind: 'SelfNodeRemediationTemplate',
          },
          escalatingRemediations: [
            {
              remediationTemplate: {
                kind: 'FenceAgentsRemediationTemplate',
                name: 'far-template',
              },
            },
            {
              remediationTemplate: {
                kind: 'Metal3RemediationTemplate',
              },
            },
          ],
        },
      };

      const result = getRemediationTemplateRefsFromHealthCheck(healthCheck);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('far-template');
    });

    it('should return empty array when no templates are present', () => {
      const healthCheck = {
        spec: {},
      };

      const result = getRemediationTemplateRefsFromHealthCheck(healthCheck);

      expect(result).toEqual([]);
    });
  });

  describe('getRemediationTemplateRefsFromHealthChecks', () => {
    it('should combine refs from machine and node health checks', () => {
      const mhc = {
        metadata: { namespace: 'openshift-machine-api' },
        spec: {
          remediationTemplate: {
            kind: 'SelfNodeRemediationTemplate',
            name: 'snr-template',
          },
        },
      };

      const nhc = {
        metadata: { namespace: 'default' },
        spec: {
          remediationTemplate: {
            kind: 'FenceAgentsRemediationTemplate',
            name: 'far-template',
          },
        },
      };

      const result = getRemediationTemplateRefsFromHealthChecks([mhc], [nhc]);

      expect(result).toHaveLength(2);
      expect(result[0].namespace).toBe('openshift-machine-api');
      expect(result[1].namespace).toBe('default');
    });

    it('should use health check namespace when ref namespace is missing', () => {
      const mhc = {
        metadata: { namespace: 'test-namespace' },
        spec: {
          remediationTemplate: {
            kind: 'SelfNodeRemediationTemplate',
            name: 'snr-template',
          },
        },
      };

      const result = getRemediationTemplateRefsFromHealthChecks([mhc], []);

      expect(result[0].namespace).toBe('test-namespace');
    });
  });

  describe('dedupeRemediationTemplateRefs', () => {
    it('should remove duplicate refs', () => {
      const refs = [
        { kind: 'SelfNodeRemediationTemplate', namespace: 'ns1', name: 'template-1' },
        { kind: 'SelfNodeRemediationTemplate', namespace: 'ns1', name: 'template-1' },
        { kind: 'FenceAgentsRemediationTemplate', namespace: 'ns2', name: 'template-2' },
      ];

      const result = dedupeRemediationTemplateRefs(refs);

      expect(result).toHaveLength(2);
      expect(result[0].kind).toBe('SelfNodeRemediationTemplate');
      expect(result[1].kind).toBe('FenceAgentsRemediationTemplate');
    });

    it('should preserve order of first occurrence', () => {
      const refs = [
        { kind: 'A', namespace: 'ns', name: 'name-1' },
        { kind: 'B', namespace: 'ns', name: 'name-2' },
        { kind: 'A', namespace: 'ns', name: 'name-1' },
      ];

      const result = dedupeRemediationTemplateRefs(refs);

      expect(result).toHaveLength(2);
      expect(result[0].kind).toBe('A');
      expect(result[1].kind).toBe('B');
    });
  });

  describe('estimateSnrRemediationBoundsFromConfig', () => {
    it('should use default values when config is undefined', () => {
      const result = estimateSnrRemediationBoundsFromConfig(undefined);

      expect(result.minSeconds).toBeGreaterThanOrEqual(FALLBACK_REMEDIATION_BOUNDS.minSeconds);
      expect(result.maxSeconds).toBeGreaterThan(result.minSeconds);
    });

    it('should use safeTimeToAssumeNodeRebootedSeconds from spec', () => {
      const config: K8sResourceKind = {
        apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
        kind: 'SelfNodeRemediationConfig',
        spec: {
          safeTimeToAssumeNodeRebootedSeconds: 240,
        },
      };

      const result = estimateSnrRemediationBoundsFromConfig(config);

      expect(result.minSeconds).toBe(240);
    });

    it('should handle missing safeTimeToAssumeNodeRebootedSeconds', () => {
      const config: K8sResourceKind = {
        apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
        kind: 'SelfNodeRemediationConfig',
        spec: {},
      };

      const result = estimateSnrRemediationBoundsFromConfig(config);

      expect(result.minSeconds).toBe(180);
    });

    it('should not use non-number values for safeTimeToAssumeNodeRebootedSeconds', () => {
      const config: K8sResourceKind = {
        apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
        kind: 'SelfNodeRemediationConfig',
        spec: {
          safeTimeToAssumeNodeRebootedSeconds: 'invalid',
        },
      };

      const result = estimateSnrRemediationBoundsFromConfig(config);

      expect(result.minSeconds).toBe(180);
    });

    it('should calculate maxSeconds with API retry phase', () => {
      const config: K8sResourceKind = {
        apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
        kind: 'SelfNodeRemediationConfig',
        spec: {
          safeTimeToAssumeNodeRebootedSeconds: 180,
          maxApiErrorThreshold: 5,
          apiCheckInterval: '30s',
          apiServerTimeout: '10s',
        },
      };

      const result = estimateSnrRemediationBoundsFromConfig(config);

      expect(result.minSeconds).toBe(180);
      expect(result.maxSeconds).toBeGreaterThan(result.minSeconds);
    });
  });

  describe('estimateFarRemediationBoundsFromTemplate', () => {
    it('should return fallback when template is undefined', () => {
      const result = estimateFarRemediationBoundsFromTemplate(undefined);

      expect(result.minSeconds).toBe(FALLBACK_REMEDIATION_BOUNDS.minSeconds);
      expect(result.maxSeconds).toBeGreaterThanOrEqual(result.minSeconds);
    });

    it('should calculate bounds from retryLimit and timeout', () => {
      const template: K8sResourceKind = {
        apiVersion: 'fence-agents-remediation.medik8s.io/v1alpha1',
        kind: 'FenceAgentsRemediationTemplate',
        spec: {
          template: {
            spec: {
              retryLimit: 3,
              timeout: '60s',
            },
          },
        },
      };

      const result = estimateFarRemediationBoundsFromTemplate(template);

      expect(result.minSeconds).toBe(FALLBACK_REMEDIATION_BOUNDS.minSeconds);
      expect(result.maxSeconds).toBe(3 * 60);
    });

    it('should handle string retryLimit', () => {
      const template: K8sResourceKind = {
        apiVersion: 'fence-agents-remediation.medik8s.io/v1alpha1',
        kind: 'FenceAgentsRemediationTemplate',
        spec: {
          template: {
            spec: {
              retryLimit: '4',
              timeout: '30s',
            },
          },
        },
      };

      const result = estimateFarRemediationBoundsFromTemplate(template);

      expect(result.maxSeconds).toBe(4 * 30);
    });

    it('should use default retry count when retryLimit is invalid', () => {
      const template: K8sResourceKind = {
        apiVersion: 'fence-agents-remediation.medik8s.io/v1alpha1',
        kind: 'FenceAgentsRemediationTemplate',
        spec: {
          template: {
            spec: {
              retryLimit: -1,
              timeout: '60s',
            },
          },
        },
      };

      const result = estimateFarRemediationBoundsFromTemplate(template);

      expect(result.maxSeconds).toBe(5 * 60);
    });
  });

  describe('estimateMdrRemediationBoundsFromTemplate', () => {
    it('should return conservative bounds', () => {
      const result = estimateMdrRemediationBoundsFromTemplate();

      expect(result.minSeconds).toBe(120);
      expect(result.maxSeconds).toBe(600);
    });
  });

  describe('computeRemediationTimeBoundsFromRefs', () => {
    it('should return undefined when refs are empty', () => {
      const result = computeRemediationTimeBoundsFromRefs([], [], []);

      expect(result).toBeUndefined();
    });

    it('should use first ref for min, sum for max', () => {
      const refs = [
        { kind: 'SelfNodeRemediationTemplate', name: 'snr', namespace: 'ns1' },
        { kind: 'FenceAgentsRemediationTemplate', name: 'far', namespace: 'ns2' },
      ];

      const snrConfigList = [
        {
          metadata: { name: 'self-node-remediation-config', namespace: 'ns1' },
          spec: { safeTimeToAssumeNodeRebootedSeconds: 100 },
        },
      ];

      const farTemplates = [
        {
          kind: 'FenceAgentsRemediationTemplate',
          metadata: { name: 'far', namespace: 'ns2' },
          spec: {
            template: {
              spec: {
                retryLimit: 2,
                timeout: '50s',
              },
            },
          },
        },
      ];

      const result = computeRemediationTimeBoundsFromRefs(refs, snrConfigList, farTemplates);

      expect(result).toBeDefined();
      expect(result.minSeconds).toBe(100);
      expect(result.maxSeconds).toBeGreaterThan(result.minSeconds);
    });

    it('should handle Metal3RemediationTemplate', () => {
      const refs = [{ kind: 'Metal3RemediationTemplate', name: 'mdr', namespace: 'ns' }];

      const result = computeRemediationTimeBoundsFromRefs(refs, [], []);

      expect(result).toBeDefined();
      expect(result.minSeconds).toBe(120);
      expect(result.maxSeconds).toBe(600);
    });

    it('should handle MachineDeletionRemediationTemplate', () => {
      const refs = [{ kind: 'MachineDeletionRemediationTemplate', name: 'mdr', namespace: 'ns' }];

      const result = computeRemediationTimeBoundsFromRefs(refs, [], []);

      expect(result).toBeDefined();
      expect(result.minSeconds).toBe(120);
      expect(result.maxSeconds).toBe(600);
    });

    it('should return undefined when no bounds can be computed', () => {
      const refs = [{ kind: 'UnknownTemplate', name: 'unknown', namespace: 'ns' }];

      const result = computeRemediationTimeBoundsFromRefs(refs, [], []);

      expect(result).toBeUndefined();
    });
  });
});
