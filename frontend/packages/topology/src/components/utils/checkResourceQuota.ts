import { getUsedPercentage } from '@console/app/src/components/resource-quota/utils';
import { ResourceQuotaModel } from '@console/internal/models';

type ResourceQuotaReturnItems = [number[], string, string];

export const checkQuotaLimit = (resourceQuotas: any): ResourceQuotaReturnItems => {
  let quotaName = '';
  let quotaKind = '';
  const resourceQuotaResources = resourceQuotas.map((quota) => {
    let resourcesAtQuota;
    if (quota?.kind === ResourceQuotaModel.kind) {
      resourcesAtQuota = Object.keys(quota?.status?.hard || {}).reduce(
        (acc, resource) =>
          getUsedPercentage(quota?.status?.hard[resource], quota?.status?.used?.[resource]) >= 100
            ? acc + 1
            : acc,
        0,
      );
    } else {
      resourcesAtQuota = Object.keys(quota?.status?.total?.hard || {}).reduce(
        (acc, resource) =>
          getUsedPercentage(
            quota?.status?.total?.hard[resource],
            quota?.status?.total?.used?.[resource],
          ) >= 100
            ? acc + 1
            : acc,
        0,
      );
    }

    if (resourcesAtQuota > 0) {
      quotaName = quota.metadata.name;
      quotaKind = quota.kind;
    }
    return resourcesAtQuota;
  });
  return [resourceQuotaResources, quotaName, quotaKind];
};
