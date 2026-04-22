import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { parseDurationToSeconds } from './utils';

export type RemediationTemplateRef = {
  apiVersion?: string;
  kind?: string;
  name?: string;
  namespace?: string;
};

export const getRemediationTemplateRefsFromHealthCheck = (
  healthCheck: K8sResourceKind,
): RemediationTemplateRef[] => {
  const single = healthCheck?.spec?.remediationTemplate
    ? [healthCheck.spec.remediationTemplate as RemediationTemplateRef]
    : [];
  const escalating = (healthCheck?.spec?.escalatingRemediations ?? [])
    .map((entry: { remediationTemplate?: RemediationTemplateRef }) => entry?.remediationTemplate)
    .filter(Boolean);
  return [...single, ...escalating].filter((entry) => entry?.name);
};

export const getRemediationTemplateRefsFromHealthChecks = (
  machineHealthChecks: K8sResourceKind[],
  nodeHealthChecks: K8sResourceKind[],
): RemediationTemplateRef[] => {
  const refs: RemediationTemplateRef[] = [];
  [...machineHealthChecks, ...nodeHealthChecks].forEach((hc) => {
    getRemediationTemplateRefsFromHealthCheck(hc).forEach((ref) => {
      refs.push({
        ...ref,
        namespace: ref.namespace ?? hc.metadata?.namespace,
      });
    });
  });
  return refs;
};

const refKey = (r: RemediationTemplateRef) =>
  `${r.kind ?? ''}/${r.namespace ?? ''}/${r.name ?? ''}`;

export const dedupeRemediationTemplateRefs = (
  refs: RemediationTemplateRef[],
): RemediationTemplateRef[] => {
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = refKey(r);
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
};

export type RemediationTimeBounds = {
  minSeconds: number;
  maxSeconds: number;
};

/** When CRDs are absent or templates cannot be resolved. */
export const FALLBACK_REMEDIATION_BOUNDS: RemediationTimeBounds = {
  minSeconds: 15,
  maxSeconds: 180,
};

const getSafeTimeToAssumeRebootSeconds = (
  spec: Record<string, unknown> | undefined,
): number | undefined => {
  if (!spec) {
    return undefined;
  }
  const v = spec.safeTimeToAssumeNodeRebootedSeconds ?? spec.safeTimeToAssumeNodeRebootSeconds;
  return typeof v === 'number' ? v : undefined;
};

/**
 * SNR: uses SelfNodeRemediationConfig (not the template) for timeouts described in HA docs.
 * Min ~ safe reboot wait; max adds worst-case API retry phase before fencing completes.
 */
export const estimateSnrRemediationBoundsFromConfig = (
  config: K8sResourceKind | undefined,
): RemediationTimeBounds => {
  const spec = config?.spec as Record<string, unknown> | undefined;
  const safeTime = getSafeTimeToAssumeRebootSeconds(spec) ?? 180;
  const maxApi = typeof spec?.maxApiErrorThreshold === 'number' ? spec.maxApiErrorThreshold : 3;
  const apiInterval =
    parseDurationToSeconds(String(spec?.apiCheckInterval)) ??
    FALLBACK_REMEDIATION_BOUNDS.minSeconds;
  const apiTimeout = parseDurationToSeconds(String(spec?.apiServerTimeout)) ?? 5;
  const apiPhaseMax = maxApi * (apiInterval + apiTimeout);
  const peerExtra =
    parseDurationToSeconds(String(spec?.peerUpdateTimeout ?? spec?.peerApiTimeout)) ?? 0;

  const minSeconds = safeTime;
  const maxSeconds = safeTime + apiPhaseMax + peerExtra + 60;

  return {
    minSeconds: Math.max(FALLBACK_REMEDIATION_BOUNDS.minSeconds, minSeconds),
    maxSeconds: Math.max(minSeconds + 1, maxSeconds),
  };
};

/**
 * FAR: fast path ~10–15s; max scales with fence-agent retries/timeouts from template.
 */
export const estimateFarRemediationBoundsFromTemplate = (
  template: K8sResourceKind | undefined,
): RemediationTimeBounds => {
  const inner = template?.spec?.template?.spec as Record<string, unknown> | undefined;
  const retryRaw = inner?.retryLimit ?? inner?.retries;
  const retry =
    typeof retryRaw === 'number'
      ? retryRaw
      : typeof retryRaw === 'string'
      ? parseInt(retryRaw, 10)
      : 5;
  const safeRetry = Number.isFinite(retry) && retry > 0 ? retry : 5;
  const timeoutSeconds =
    parseDurationToSeconds(String(inner?.timeout ?? inner?.fenceTimeout)) ??
    FALLBACK_REMEDIATION_BOUNDS.maxSeconds;

  return {
    minSeconds: FALLBACK_REMEDIATION_BOUNDS.minSeconds,
    maxSeconds: Math.max(FALLBACK_REMEDIATION_BOUNDS.minSeconds, safeRetry * timeoutSeconds),
  };
};

/**
 * MDR / Metal3: no precise timing in empty templates; use conservative bounds.
 */
export const estimateMdrRemediationBoundsFromTemplate = (): RemediationTimeBounds => ({
  minSeconds: 120,
  maxSeconds: 600,
});

const findResourceByRef = (
  ref: RemediationTemplateRef,
  list: K8sResourceKind[] | undefined,
  kind: string,
): K8sResourceKind | undefined =>
  list?.find(
    (r) =>
      r.kind === kind &&
      r.metadata?.name === ref.name &&
      (r.metadata?.namespace ?? '') === (ref.namespace ?? ''),
  );

const findSnrConfigForTemplateRef = (
  ref: RemediationTemplateRef,
  configs: K8sResourceKind[] | undefined,
): K8sResourceKind | undefined => {
  const ns = ref.namespace ?? '';

  // Find the SNR Config for the ref's namespace or the well-defined SNR by name if none exist
  return (
    configs?.find((c) => c.metadata?.namespace === ns) ??
    configs?.find((c) => c.metadata?.name === 'self-node-remediation-config') ??
    configs?.[0]
  );
};

/**
 * Ordered refs (per health check order): first-step min, sum of max for sequential escalations.
 */
export const computeRemediationTimeBoundsFromRefs = (
  orderedRefs: RemediationTemplateRef[],
  snrConfigs: K8sResourceKind[] | undefined,
  farTemplates: K8sResourceKind[] | undefined,
): RemediationTimeBounds | undefined => {
  if (!orderedRefs.length) {
    return undefined;
  }

  const boundsList: RemediationTimeBounds[] = [];

  orderedRefs.forEach((ref) => {
    const kind = ref.kind ?? '';
    if (kind === 'SelfNodeRemediationTemplate') {
      const cfg = findSnrConfigForTemplateRef(ref, snrConfigs);
      boundsList.push(estimateSnrRemediationBoundsFromConfig(cfg));
      return;
    }
    if (kind === 'FenceAgentsRemediationTemplate') {
      const tpl = findResourceByRef(ref, farTemplates, 'FenceAgentsRemediationTemplate');
      boundsList.push(estimateFarRemediationBoundsFromTemplate(tpl));
      return;
    }
    if (kind === 'MachineDeletionRemediationTemplate' || kind === 'Metal3RemediationTemplate') {
      boundsList.push(estimateMdrRemediationBoundsFromTemplate());
    }
  });

  if (!boundsList.length) {
    return undefined;
  }

  const { minSeconds } = boundsList[0];
  const maxSeconds = boundsList.reduce((sum, b) => sum + b.maxSeconds, 0);

  return {
    minSeconds,
    maxSeconds: Math.max(minSeconds + 1, maxSeconds),
  };
};

/**
 * Watches remediation-related CRs used to refine estimated recovery time.
 * Missing CRDs may surface watch errors; callers should fall back to defaults.
 */
export const useRemediationResourcesForEstimatedRecovery = (): {
  snrConfigs: K8sResourceKind[];
  farTemplates: K8sResourceKind[];
  mdrTemplates: K8sResourceKind[];
  metal3Templates: K8sResourceKind[];
  loaded: boolean;
} => {
  const [snrConfigs, snrLoaded, snrLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    groupVersionKind: {
      group: 'self-node-remediation.medik8s.io',
      version: 'v1alpha1',
      kind: 'SelfNodeRemediationConfig',
    },
    namespaced: true,
  });
  const [farTemplates, farLoaded, farLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    groupVersionKind: {
      group: 'fence-agents-remediation.medik8s.io',
      version: 'v1alpha1',
      kind: 'FenceAgentsRemediationTemplate',
    },
    namespaced: true,
  });
  const [mdrTemplates, mdrLoaded, mdrLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    groupVersionKind: {
      group: 'machine-deletion-remediation.medik8s.io',
      version: 'v1alpha1',
      kind: 'MachineDeletionRemediationTemplate',
    },
    namespaced: true,
  });
  const [metal3Templates, metal3Loaded, metal3LoadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    groupVersionKind: {
      group: 'infrastructure.cluster.x-k8s.io',
      version: 'v1beta1',
      kind: 'Metal3RemediationTemplate',
    },
    namespaced: true,
  });

  return {
    snrConfigs: snrConfigs ?? [],
    farTemplates: farTemplates ?? [],
    mdrTemplates: mdrTemplates ?? [],
    metal3Templates: metal3Templates ?? [],
    loaded:
      (snrLoaded || !!snrLoadError) &&
      (farLoaded || !!farLoadError) &&
      (mdrLoaded || !!mdrLoadError) &&
      (metal3Loaded || !!metal3LoadError),
  };
};
