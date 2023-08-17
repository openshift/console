import { PrometheusRulesResponse } from '@console/dynamic-plugin-sdk';
import { coFetchJSON } from '@console/internal/co-fetch';

/**
 * Merges prometheus monitoring alerts with external sources
 */
export const fetchAlerts = async (
  prometheusURL: string,
  externalAlertsFetch?: Array<{
    id: string;
    getAlertingRules: (namespace?: string) => Promise<PrometheusRulesResponse>;
  }>,
  namespace?: string,
): Promise<PrometheusRulesResponse> => {
  if (!externalAlertsFetch || externalAlertsFetch.length === 0) {
    return coFetchJSON(prometheusURL);
  }

  const resolvedExternalAlertsSources = externalAlertsFetch.map((extensionProperties) => ({
    id: extensionProperties.id,
    fetch: extensionProperties.getAlertingRules,
  }));

  const sourceIds = ['prometheus', ...resolvedExternalAlertsSources.map((source) => source.id)];

  try {
    const groups = await Promise.allSettled([
      coFetchJSON(prometheusURL),
      ...resolvedExternalAlertsSources.map((source) => source.fetch(namespace)),
    ]).then((results) =>
      results
        .map((result, i) => ({ sourceId: sourceIds[i], alerts: result }))
        .flatMap((result) =>
          result.alerts.status === 'fulfilled' && result.alerts.value?.data?.groups
            ? result.alerts.value.data.groups.map((group) => ({
                ...group,
                rules: [...group.rules.map((rule) => ({ ...rule, sourceId: result.sourceId }))],
              }))
            : [],
        ),
    );

    return { data: { groups }, status: 'success' };
  } catch {
    return coFetchJSON(prometheusURL);
  }
};
